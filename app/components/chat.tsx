import { useDebouncedCallback } from "use-debounce";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from "react";

import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import PromptIcon from "../icons/prompt.svg";
import MaskIcon from "../icons/mask.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/clear.svg";
import PinIcon from "../icons/pin.svg";
import EditIcon from "../icons/rename.svg";
import Logo from "../icons/Logo.png";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";
import RobotIcon from "../icons/robot.svg";

import {
  ChatMessage,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  createMessage,
  useAccessStore,
  Theme,
  useAppConfig,
  DEFAULT_TOPIC,
  ModelType,
} from "../store";

import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
} from "../utils";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { Prompt, usePromptStore } from "../store/prompt";
import Locale from "../locales";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  List,
  ListItem,
  Modal,
  Selector,
  showConfirm,
  showPrompt,
  showToast,
} from "./ui-lib";
import { useLocation, useNavigate } from "react-router-dom";
import { LAST_INPUT_KEY, Path, REQUEST_TIMEOUT_MS } from "../constant";
import { Avatar } from "./emoji";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { prettyObject } from "../utils/format";
import { ExportMessageModal } from "./exporter";
import { getClientConfig } from "../config/client";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function SessionConfigModel(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Context.Edit}
        onClose={() => props.onClose()}
        actions={[
          <IconButton
            key="reset"
            icon={<ResetIcon />}
            bordered
            text={Locale.Chat.Config.Reset}
            onClick={async () => {
              if (await showConfirm(Locale.Memory.ResetConfirm)) {
                chatStore.updateCurrentSession(
                  (session) => (session.memoryPrompt = ""),
                );
              }
            }}
          />,
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            text={Locale.Chat.Config.SaveAs}
            onClick={() => {
              navigate(Path.Masks);
              setTimeout(() => {
                maskStore.create(session.mask);
              }, 500);
            }}
          />,
        ]}
      >
        <MaskConfig
          mask={session.mask}
          updateMask={(updater) => {
            const mask = { ...session.mask };
            updater(mask);
            chatStore.updateCurrentSession((session) => (session.mask = mask));
          }}
          shouldSyncFromGlobal
          extraListItems={
            session.mask.modelConfig.sendMemory ? (
              <ListItem
                title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
              ></ListItem>
            ) : (
              <></>
            )
          }
        ></MaskConfig>
      </Modal>
    </div>
  );
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  setShowModal: (_: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const context = session.mask.context;

  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {/* {props.showToast && (
        <div
          className={styles["prompt-toast-inner"] + " clickable"}
          role="button"
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {Locale.Context.Toast(context.length)}
          </span>
        </div>
      )}
      {props.showModal && (
        <SessionConfigModel onClose={() => props.setShowModal(false)} />
      )} */}
    </div>
  );
}

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
  prompts: RenderPompt[];
  onPromptSelect: (prompt: RenderPompt) => void;
}) {
  const noPrompts = props.prompts.length === 0;
  const [selectIndex, setSelectIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectIndex(0);
  }, [props.prompts.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        e.stopPropagation();
        e.preventDefault();
        const nextIndex = Math.max(
          0,
          Math.min(props.prompts.length - 1, selectIndex + delta),
        );
        setSelectIndex(nextIndex);
        selectedRef.current?.scrollIntoView({
          block: "center",
        });
      };

      if (e.key === "ArrowUp") {
        changeIndex(1);
      } else if (e.key === "ArrowDown") {
        changeIndex(-1);
      } else if (e.key === "Enter") {
        const selectedPrompt = props.prompts.at(selectIndex);
        if (selectedPrompt) {
          props.onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prompts.length, selectIndex]);

  if (noPrompts) return null;
  return (
    <div className={styles["prompt-hints"]}>
      {props.prompts.map((prompt, i) => (
        <div
          ref={i === selectIndex ? selectedRef : null}
          className={
            styles["prompt-hint"] +
            ` ${i === selectIndex ? styles["prompt-hint-selected"] : ""}`
          }
          key={prompt.title + i.toString()}
          onClick={() => props.onPromptSelect(prompt)}
          onMouseEnter={() => setSelectIndex(i)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </div>
      ))}
    </div>
  );
}

function ClearContextDivider() {
  const chatStore = useChatStore();

  return (
    <div
      className={styles["clear-context"]}
      onClick={() =>
        chatStore.updateCurrentSession(
          (session) => (session.clearContextIndex = undefined),
        )
      }
    >
      <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
      <div className={styles["clear-context-revert-btn"]}>
        {Locale.Context.Revert}
      </div>
    </div>
  );
}

function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState({
    full: 16,
    icon: 16,
  });

  function updateWidth() {
    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({
      full: textWidth + iconWidth,
      icon: iconWidth,
    });
  }

  return (
    <div
      className={`${styles["chat-input-action"]} clickable`}
      onClick={() => {
        props.onClick();
        setTimeout(updateWidth, 1);
      }}
      onMouseEnter={updateWidth}
      onTouchStart={updateWidth}
      style={
        {
          "--icon-width": `${width.icon}px`,
          "--full-width": `${width.full}px`,
        } as React.CSSProperties
      }
    >
      <div ref={iconRef} className={styles["icon"]}>
        {props.icon}
      </div>
      <div className={styles["text"]} ref={textRef}>
        {props.text}
      </div>
    </div>
  );
}

function useScrollToBottom() {
  // for auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollToBottom = useCallback(() => {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => dom.scrollTo(0, dom.scrollHeight));
    }
  }, []);

  // auto scroll
  useEffect(() => {
    autoScroll && scrollToBottom();
  });

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollToBottom,
  };
}

export function ChatActions(props: {
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();

  // switch model
  const currentModel = chatStore.currentSession().mask.modelConfig.model;
  const models = useMemo(
    () =>
      config
        .allModels()
        .filter((m) => m.available)
        .map((m) => m.name),
    [config],
  );
  const [showModelSelector, setShowModelSelector] = useState(false);

  return (
    <div></div>
    // <div className={styles["chat-input-actions"]}>
    //   {couldStop && (
    //     <ChatAction
    //       onClick={stopAll}
    //       text={Locale.Chat.InputActions.Stop}
    //       icon={<StopIcon />}
    //     />
    //   )}
    //   {!props.hitBottom && (
    //     <ChatAction
    //       onClick={props.scrollToBottom}
    //       text={Locale.Chat.InputActions.ToBottom}
    //       icon={<BottomIcon />}
    //     />
    //   )}
    //   {props.hitBottom && (
    //     <ChatAction
    //       onClick={props.showPromptModal}
    //       text={Locale.Chat.InputActions.Settings}
    //       icon={<SettingsIcon />}
    //     />
    //   )}

    //   <ChatAction
    //     onClick={nextTheme}
    //     text={Locale.Chat.InputActions.Theme[theme]}
    //     icon={
    //       <>
    //         {theme === Theme.Auto ? (
    //           <AutoIcon />
    //         ) : theme === Theme.Light ? (
    //           <LightIcon />
    //         ) : theme === Theme.Dark ? (
    //           <DarkIcon />
    //         ) : null}
    //       </>
    //     }
    //   />

    //   <ChatAction
    //     onClick={props.showPromptHints}
    //     text={Locale.Chat.InputActions.Prompt}
    //     icon={<PromptIcon />}
    //   />

    //   <ChatAction
    //     onClick={() => {
    //       navigate(Path.Masks);
    //     }}
    //     text={Locale.Chat.InputActions.Masks}
    //     icon={<MaskIcon />}
    //   />

    //   <ChatAction
    //     text={Locale.Chat.InputActions.Clear}
    //     icon={<BreakIcon />}
    //     onClick={() => {
    //       chatStore.updateCurrentSession((session) => {
    //         if (session.clearContextIndex === session.messages.length) {
    //           session.clearContextIndex = undefined;
    //         } else {
    //           session.clearContextIndex = session.messages.length;
    //           session.memoryPrompt = ""; // will clear memory
    //         }
    //       });
    //     }}
    //   />

    //   <ChatAction
    //     onClick={() => setShowModelSelector(true)}
    //     text={currentModel}
    //     icon={<RobotIcon />}
    //   />

    //   {showModelSelector && (
    //     <Selector
    //       items={models.map((m) => ({
    //         title: m,
    //         value: m,
    //       }))}
    //       onClose={() => setShowModelSelector(false)}
    //       onSelection={(s) => {
    //         if (s.length === 0) return;
    //         chatStore.updateCurrentSession((session) => {
    //           session.mask.modelConfig.model = s[0] as ModelType;
    //           session.mask.syncGlobalConfig = false;
    //         });
    //         showToast(s[0]);
    //       }}
    //     />
    //   )}
    // </div>
  );
}

export function EditMessageModal(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const [messages, setMessages] = useState(session.messages.slice());

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.UI.Edit}
        onClose={props.onClose}
        actions={[
          <IconButton
            text={Locale.UI.Cancel}
            icon={<CancelIcon />}
            key="cancel"
            onClick={() => {
              props.onClose();
            }}
          />,
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              chatStore.updateCurrentSession(
                (session) => (session.messages = messages),
              );
              props.onClose();
            }}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Chat.EditMessage.Topic.Title}
            subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
          >
            <input
              type="text"
              value={session.topic}
              onInput={(e) =>
                chatStore.updateCurrentSession(
                  (session) => (session.topic = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List>
        <ContextPrompts
          context={messages}
          updateContext={(updater) => {
            const newMessages = messages.slice();
            updater(newMessages);
            setMessages(newMessages);
          }}
        />
      </Modal>
    </div>
  );
}

export function Chat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const [session, sessionIndex] = useChatStore((state) => [
    state.currentSession(),
    state.currentSessionIndex,
  ]);
  const config = useAppConfig();
  const fontSize = config.fontSize;

  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const { scrollRef, setAutoScroll, scrollToBottom } = useScrollToBottom();
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();

  const onChatBodyScroll = (e: HTMLElement) => {
    const isTouchBottom = e.scrollTop + e.clientHeight >= e.scrollHeight - 10;
    setHitBottom(isTouchBottom);
  };

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateCurrentSession(
        (session) => (session.clearContextIndex = session.messages.length),
      ),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.startsWith(ChatCommandPrefix)) {
      setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  const doSubmit = (userInput: string) => {
    if (userInput.trim() === "") return;
    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);
    chatStore.onUserInput(userInput).then(() => setIsLoading(false));
    localStorage.setItem(LAST_INPUT_KEY, userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };

  const onPromptSelect = (prompt: RenderPompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
  };

  useEffect(() => {
    chatStore.updateCurrentSession((session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        console.log("[Mask] syncing from global, name = ", session.mask.name);
        session.mask.modelConfig = { ...config.modelConfig };
      }
    });
    window.scrollTo(0, document.documentElement.clientHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, message.content)) {
      if (userInput.length === 0) {
        setUserInput(message.content);
      }

      e.preventDefault();
    }
  };

  const deleteMessage = (msgId?: string) => {
    chatStore.updateCurrentSession(
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const onResend = (message: ChatMessage) => {
    // when it is resending a message
    // 1. for a user's message, find the next bot response
    // 2. for a bot's message, find the last user's input
    // 3. delete original user input and bot's message
    // 4. resend the user's input

    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );

    if (resendingIndex <= 0 || resendingIndex >= session.messages.length) {
      console.error("[Chat] failed to find resending message", message);
      return;
    }

    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;

    if (message.role === "assistant") {
      // if it is resending a bot's message, find the user input for it
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      // if it is resending a user's input, find the bot's response
      userMessage = message;
      for (let i = resendingIndex; i < session.messages.length; i += 1) {
        if (session.messages[i].role === "assistant") {
          botMessage = session.messages[i];
          break;
        }
      }
    }

    if (userMessage === undefined) {
      console.error("[Chat] failed to resend", message);
      return;
    }

    // delete the original messages
    deleteMessage(userMessage.id);
    deleteMessage(botMessage?.id);

    // resend the message
    setIsLoading(true);
    chatStore.onUserInput(userMessage.content).then(() => setIsLoading(false));
    inputRef.current?.focus();
  };

  const onPinMessage = (message: ChatMessage) => {
    chatStore.updateCurrentSession((session) =>
      session.mask.context.push(message),
    );

    showToast(Locale.Chat.Actions.PinToastContent, {
      text: Locale.Chat.Actions.PinToastAction,
      onClick: () => {
        setShowPromptModal(true);
      },
    });
  };

  const context: RenderMessage[] = session.mask.hideContext
    ? []
    : session.mask.context.slice();

  const accessStore = useAccessStore();

  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== BOT_HELLO.content
  ) {
    const copiedHello = Object.assign({}, BOT_HELLO);
    if (!accessStore.isAuthorized()) {
      copiedHello.content = Locale.Error.Unauthorized;
    }
    context.push(copiedHello);
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length
      : -1;

  // preview messages
  const messages = context
    .concat(session.messages as RenderMessage[])
    .concat(
      isLoading
        ? [
            {
              ...createMessage({
                role: "assistant",
                content: "……",
              }),
              preview: true,
            },
          ]
        : [],
    )
    .concat(
      userInput.length > 0 && config.sendPreviewBubble
        ? [
            {
              ...createMessage({
                role: "user",
                content: userInput,
              }),
              preview: true,
            },
          ]
        : [],
    );

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const location = useLocation();
  const isChat = location.pathname === Path.Chat;

  const autoFocus = !isMobileScreen || isChat; // only focus in chat page
  // const autoFocus = true
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  useCommand({
    fill: setUserInput,
    submit: (text) => {
      doSubmit(text);
    },
    code: (text) => {
      console.log("[Command] got code from url: ", text);
      showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.updateCode(text);
        }
      });
    },
    settings: (text) => {
      try {
        const payload = JSON.parse(text) as {
          key?: string;
          url?: string;
        };

        console.log("[Command] got settings from url: ", payload);

        if (payload.key || payload.url) {
          showConfirm(
            Locale.URLCommand.Settings +
              `\n${JSON.stringify(payload, null, 4)}`,
          ).then((res) => {
            if (!res) return;
            if (payload.key) {
              accessStore.updateToken(payload.key);
            }
            if (payload.url) {
              accessStore.updateOpenAiUrl(payload.url);
            }
          });
        }
      } catch {
        console.error("[Command] failed to get settings from url: ", text);
      }
    },
  });

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  return (
    <div className={styles.chat} key={session.id}>
      <div className="window-header" data-tauri-drag-region>
        {isMobileScreen && (
          <div className="window-actions">
            <div className={"window-action-button"}>
              <IconButton
                icon={<ReturnIcon />}
                bordered
                title={Locale.Chat.Actions.ChatList}
                onClick={() => navigate(Path.Home)}
              />
            </div>
          </div>
        )}

        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
            onClickCapture={() => setIsEditingMessage(true)}
          >
            {!session.topic ? DEFAULT_TOPIC : session.topic}
          </div>
          <div className="window-header-sub-title">
            {Locale.Chat.SubTitle(session.messages.length)}
          </div>
        </div>
        {/* <div className="window-actions">
          {!isMobileScreen && (
            <div className="window-action-button">
              <IconButton
                icon={<RenameIcon />}
                bordered
                onClick={() => setIsEditingMessage(true)}
              />
            </div>
          )}
          <div className="window-action-button">
            <IconButton
              icon={<ExportIcon />}
              bordered
              title={Locale.Chat.Actions.Export}
              onClick={() => {
                setShowExport(true);
              }}
            />
          </div>
          {showMaxIcon && (
            <div className="window-action-button">
              <IconButton
                icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                bordered
                onClick={() => {
                  config.update(
                    (config) => (config.tightBorder = !config.tightBorder),
                  );
                }}
              />
            </div>
          )}
        </div> */}

        <PromptToast
          showToast={!hitBottom}
          showModal={showPromptModal}
          setShowModal={setShowPromptModal}
        />
      </div>

      <div
        className={styles["chat-body"]}
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onMouseDown={() => inputRef.current?.blur()}
        onWheel={(e) => setAutoScroll(hitBottom && e.deltaY > 0)}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {messages.map((message, i) => {
          const isUser = message.role === "user";
          const isContext = i < context.length;
          const showActions =
            i > 0 &&
            !(message.preview || message.content.length === 0) &&
            !isContext;
          const showTyping = message.preview || message.streaming;

          const shouldShowClearContextDivider = i === clearContextIndex - 1;

          return (
            <Fragment key={i}>
              <div
                className={
                  isUser ? styles["chat-message-user"] : styles["chat-message"]
                }
              >
                <div className={styles["chat-message-container"]}>
                  <div className={styles["chat-message-header"]}>
                    <div className={styles["chat-message-avatar"]}>
                      <div className={styles["chat-message-edit"]}>
                        <IconButton
                          icon={<EditIcon />}
                          onClick={async () => {
                            const newMessage = await showPrompt(
                              Locale.Chat.Actions.Edit,
                              message.content,
                              10,
                            );
                            chatStore.updateCurrentSession((session) => {
                              const m = session.messages.find(
                                (m) => m.id === message.id,
                              );
                              if (m) {
                                m.content = newMessage;
                              }
                            });
                          }}
                        ></IconButton>
                      </div>
                      {isUser ? (
                        // <Avatar avatar={config.avatar} />
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <img
                            style={{ width: "20px", height: "20px" }}
                            src="data:image/png;base64,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"
                            alt=""
                          />
                        </div>
                      ) : (
                        // <MaskAvatar mask={session.mask} />
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <img
                            style={{ width: "20px", height: "20px" }}
                            src="data:image/png;base64,AAABAAMAMDAAAAEAIACoJQAANgAAACAgAAABACAAqBAAAN4lAAAQEAAAAQAgAGgEAACGNgAAKAAAADAAAABgAAAAAQAgAAAAAACAJQAAAAAAAAAAAAAAAAAAAAAAAB+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egvP+HoHz/xuA8/5Lm/b+XaX2/yyJ9P4bgPP+HoL0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+JYX0/7nY+f78/vv+/f78/+31+/5Xofb+HoL0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/rNH5///////////////////////e7Pz/HoH0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/xuA8/6Rwvn+/v78//7+/v7+/v7+//////7+/v79/v3+KYf0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/3Kw9/79/vz+//////7+/v7+/v7+//////7+/v7f7fz+HoL0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8af/P/WqP2//j8/f/+/v7///////////////////////j7/P9bpPb/HoL0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/hyA8/9Gl/X+7/b7//7+/v7+/v7+//////7+/v7+/v7+/f7+/3ez9/4bgPP+H4Hz/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/jWO9P/j7/v+/f79//7+/v7+/v7+//////7+/v7+/v3+j8H4/x+C8/4egfT+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Koj0/8/l+//+/v7///////////////////////7+/P+v0vr/IIP0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h2B9P8gg/T+u9n6/v7+/v/+/v7+//////7+/v7+/v7+/v7+/8fg+v4jhPT+HYH0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P+hy/n//v78///////////////////////+/v7/2er8/y+L9P8cgPP/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoL0/oC4+P/+/v3+/v7+/v/////+/v7+//////3+/f7q8/v+PZL1/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+B9P8bgPP+aaz2/vz9/f/+/v3+/v7+/v/////+/v7+/v7+//T5+/5Qnfb+G4Dz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h6B8/9Rnvb+9fn7/v/////+/v7+/v7+/v/////+/v7++/39/2eq9v4af/P+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/zqR9f/s9Pz////////////////////////////+/vz/gbj4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8bgPP+L4v0/tzs+//+/v3+/v7+/v/////+/v7+/v7+/v7+/f+fyvn+G4Dz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8khfT+yOD5/v3+/v/+/v7+/v7+/v/////+/v7+/v7+/rnY+v8egfP+H4Hz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/xyA9P9UoPX/h7z4/2qs9v8ihPT/HoH0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x2B8/+w0/r//f79//////////////////////////3/z+T7/ymI9P8egfP/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfT+HoHz/ou/+P/9/vz+///8//7+/P7H4Pv+IoPz/h+C9P8egfP+HoHz/h+C9P8egfT+HoHz/o/B+P/+/vz+/v7+/v/////+/v7+/v7+/v/////6/P3+Spr1/huA8/8cgPP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfT+MIv0/vj7/f/+/v7+//////7+/v7+/vz+Zqr2/h+C9P8egfP+HoHz/h+C9P8dgfP+MYz0/vj7/f/+/v7+/v7+/v/////+/v7+/v7+/v/////+/v3+9fr8/pvH+P8piPT+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8dgfP/SJn1//3+/v/+/v7///////////////////////////////////////3+/f/d7fz/Q5f1/x6C9P8egfT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+JIX0/ufy/P/+/v3+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v7+/v/+/v3+8vj8/1Wg9v4bgPP+HoHz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/k6c9f/j8Pz+/f79/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+//////H3+/5GmPX+HoHz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8ig/T/P5T1/1ag9v+Buff/yOD5//r9/f/+//7////////////////////////////e7Pz/JYX0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HYHz/huA8/8af/P+G3/z/lOf9v/a6vz+/v78/v/////+/v7+//////7+/v7+/vz+lcT4/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h2B8/8nh/T+w976/v/////+/v7+//////7+/v7+/v7+9fr9/zeP9P4dgfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP/LIn0/9rr+//+/v3//////////////////////5HB+P8Zf/P/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfT+HoHz/lSg9v/+/v3+//////7+/v7+/v7+/////9rq+v4bgPP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/hyA8//O5Pv+//////7+/v7+/v7+//////r8+/42j/T+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C8/+GvPj//v79//////////////////z+/P9dpfb/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h6B8/9cpPb+/P78//7+/v7+/v7+//////3+/f52s/f+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P9OnPb//P78//////////////////3+/f9+t/j/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P9bpPb+/P79//7+/v7+/v7+//////3+/f52s/f+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h2B8/+Fu/j+/f79//7+/v7+/v7+//////z+/P5epfb+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C8//L4vv//f7+//////////////////r8/P84j/X/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/k+d9f/9/v3+//////7+/v7+/v7+/////9vr+f4bgPP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+KIf0/tfp+//+/v3+//////7+/v7+/v7+/v7+/5PD9/4bf/P+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8nhvT/wNz5//3+/f/+//7////////////+/v7/9/v9/ziQ9P8cgPP/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8dgfP+HoH0/kmZ9f/V6Pv+/f79/v/////+/v7+//////7+/v7+/vz+mcb5/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/v3+mMb5/j+U9f8/lPX+P5T1/j+U9f8/lPX+P5T1/j+U9f8/lPX+O5L1/kyb9v94tPf+wd36/v39/f/+/v3+/v7+/v/////+/v7+//////7+/f7g7vz+KIf0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1///////////////////////+/v7//P79//3+/P/9/vz//f78//3+/P/9/vz//f78//3+/P/9/vz//P78//z+/P/9/v3//f79//////////////////////////////////H4/P9KmvX/HYH0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v3+8vj8/12k9v4dgfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgfP+Spr1/v7+/v/+/v7+//////7+/v7+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v///P/i7/z+S5v2/x2B8/4dgfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8dgfT/L4v0//j8/f/+/v7////////////////////////////////////////////////////////////////////////////////////////////+/v7/+fz9/57J+f8qiPT/HYHz/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/oq++P/8/fz+/f79//7+/v7+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/f7+/v3+/f/9/vz++/38/uPv+v+bx/j+PZP1/h+C9P8egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/ht/8/9VoPb+ir74/47A+f6OwPn+jsD5/o7A+f+OwPn+jsD5/o7A+f+OwPn+jsD5/o7A+f+OwPn+jcD4/oS7+P9qrPf+QZX1/h6B8/8af/P+HIDz/h+C9P8egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAgAAAAQAAAAAEAIAAAAAAAgBAAAAAAAAAAAAAAAAAAAAAAAAAegfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4jhPT+MYz0/iGD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+IYLz/pjG9/7F3/n+ib33/iqI9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iqI9P6bx/j+/v7+/v7+/v73+v3+Y6j2/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+gbj3/vL3/f7+/v7+/v7+/vf6/f5kqPb+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+IYPz/mqs9v77/f3+/v7+/v7+/v7+/v7+n8r4/iuJ9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/5YofX+3+37/v7+/v7+/v7+/v79/szi+/4xjPT+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+Rpf1/uny/P7+/v7+/v7+/v7+/v7H4Pr+P5T1/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/juS9f7B3Pr+/v7+/v7+/v7+/v7+7fX9/kua9f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4uivT+xd76/v7+/f7+/v7+/v7+/uPv+/5epPb+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+KYfz/pnG9/7+/v7+/v79/v7+/v78/f3+crD2/iKD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iKD8/6bx/j++vz9/v7+/v7+/v7+8/j9/om99/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4fgvP+bq72/vb6/f7+/v3+/v7+/v7+/v6jy/n+LIjz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoH0/h6B8/5ao/b+o8z4/oW79/4yjPT+HoHz/h6B8/4egfT+HoHz/nCv9v7s9Pz+/v7+/v7+/v7+/v7+wNz6/iKD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfT+JoXz/uHu/P7+/v3+9/r8/oO69/4egfP+HoHz/h6B8/4mhfP+4u/8/v7+/f7+/v7+/v7+/v7+/v7R5fr+V6H1/iCD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/jGM9P74+/3+/v7+/v7+/v7+/v7+/v7+/v7+/v72+v3+oMv5/imI9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+H4Hz/qTM+f73+v3+/v7+/v7+/v7+/v7+/v7+/v7+/v77/f3+kMH3/iaG8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+H4Lz/i2J9P5LmvX+frf2/tLm+/76/P3+/v7+/v7+/v73+v3+f7f3/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/h6B8/4egfP+HYHz/h2B8/4cgPP+QJT0/rDT+f7+/v7+/v7+/v7+/f7i7/z+KIfz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+JITz/sjg+v7+/v7+/v7+/v7+/v55tPb+HYHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+aav2/vT4/f7+/v7+/v7+/q7S+P4jhPP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/48kvT+0OX6/v7+/v7+/v7+yuH6/jaP9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jCL9P7D3vr+/v7+/v7+/v7R5fv+PZP1/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+N4/0/svi+v7+/v7+/v7+/s3j+v45kPT+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/5QnfX+5PD8/v7+/v7+/v7+vtr5/iuI9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+IILz/qfO+f7+/v7+/v7+/v7+/v6Lvvb+HYHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iCC8/5qq/b+9Pn8/v7+/v7+/v7++vz9/kKV9P4dgfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+sdP5/imH9P4ph/P+KYf0/imH8/4ph/T+KIbz/jKM9P5Mm/X+pMz5/vT5/P7+/v7+/v7+/vr8/f6eyPj+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/v7m8fz+vdr5/r3a+f692vn+vdr5/r3a+f682vn+xt/6/uDu+/7+/v7+/v7+/v7+/v7+/v7+zOP6/j+U9f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7++/39/s3j+v45kPT+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4ui/T++/39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+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"
                            alt=""
                          />
                        </div>
                      )}
                    </div>

                    {/* {showActions && (
                      <div className={styles["chat-message-actions"]}>
                        <div className={styles["chat-input-actions"]}>
                          {message.streaming ? (
                            <ChatAction
                              text={Locale.Chat.Actions.Stop}
                              icon={<StopIcon />}
                              onClick={() => onUserStop(message.id ?? i)}
                            />
                          ) : (
                            <>
                              <ChatAction
                                text={Locale.Chat.Actions.Retry}
                                icon={<ResetIcon />}
                                onClick={() => onResend(message)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Delete}
                                icon={<DeleteIcon />}
                                onClick={() => onDelete(message.id ?? i)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Pin}
                                icon={<PinIcon />}
                                onClick={() => onPinMessage(message)}
                              />
                              <ChatAction
                                text={Locale.Chat.Actions.Copy}
                                icon={<CopyIcon />}
                                onClick={() => copyToClipboard(message.content)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )} */}
                  </div>
                  {showTyping && (
                    <div className={styles["chat-message-status"]}>
                      {Locale.Chat.Typing}
                    </div>
                  )}
                  <div className={styles["chat-message-item"]}>
                    <Markdown
                      content={message.content}
                      loading={
                        (message.preview || message.content.length === 0) &&
                        !isUser
                      }
                      onContextMenu={(e) => onRightClick(e, message)}
                      onDoubleClickCapture={() => {
                        if (!isMobileScreen) return;
                        setUserInput(message.content);
                      }}
                      fontSize={fontSize}
                      parentRef={scrollRef}
                      defaultShow={i >= messages.length - 10}
                    />
                  </div>

                  <div className={styles["chat-message-action-date"]}>
                    {isContext
                      ? Locale.Chat.IsContext
                      : message.date.toLocaleString()}
                  </div>
                </div>
              </div>
              {shouldShowClearContextDivider && <ClearContextDivider />}
            </Fragment>
          );
        })}
      </div>

      <div className={styles["chat-input-panel"]}>
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        <ChatActions
          showPromptModal={() => setShowPromptModal(true)}
          scrollToBottom={scrollToBottom}
          hitBottom={hitBottom}
          showPromptHints={() => {
            // Click again to close
            if (promptHints.length > 0) {
              setPromptHints([]);
              return;
            }

            inputRef.current?.focus();
            setUserInput("/");
            onSearch("");
          }}
        />
        <div className={styles["chat-input-panel-inner"]}>
          <textarea
            ref={inputRef}
            className={styles["chat-input"]}
            placeholder={Locale.Chat.Input(submitKey)}
            onInput={(e) => onInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={onInputKeyDown}
            onFocus={() => setAutoScroll(true)}
            onBlur={() => setAutoScroll(false)}
            rows={inputRows}
            autoFocus={autoFocus}
            style={{
              fontSize: config.fontSize,
            }}
          />
          <IconButton
            icon={<SendWhiteIcon />}
            text={Locale.Chat.Send}
            className={styles["chat-input-send"]}
            type="primary"
            onClick={() => doSubmit(userInput)}
          />
        </div>
      </div>

      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}
    </div>
  );
}
