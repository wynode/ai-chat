"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
// import Logo from "../icons/Logo.png";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getLang } from "../locales";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { api } from "../client/api";
import { useAccessStore } from "../store";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && (
        <img
          style={{ width: "40px", height: "40px" }}
          src="data:image/png;base64,AAABAAMAMDAAAAEAIACoJQAANgAAACAgAAABACAAqBAAAN4lAAAQEAAAAQAgAGgEAACGNgAAKAAAADAAAABgAAAAAQAgAAAAAACAJQAAAAAAAAAAAAAAAAAAAAAAAB+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egvP+HoHz/xuA8/5Lm/b+XaX2/yyJ9P4bgPP+HoL0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+JYX0/7nY+f78/vv+/f78/+31+/5Xofb+HoL0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/rNH5///////////////////////e7Pz/HoH0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/xuA8/6Rwvn+/v78//7+/v7+/v7+//////7+/v79/v3+KYf0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/3Kw9/79/vz+//////7+/v7+/v7+//////7+/v7f7fz+HoL0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8af/P/WqP2//j8/f/+/v7///////////////////////j7/P9bpPb/HoL0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/hyA8/9Gl/X+7/b7//7+/v7+/v7+//////7+/v7+/v7+/f7+/3ez9/4bgPP+H4Hz/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/jWO9P/j7/v+/f79//7+/v7+/v7+//////7+/v7+/v3+j8H4/x+C8/4egfT+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Koj0/8/l+//+/v7///////////////////////7+/P+v0vr/IIP0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h2B9P8gg/T+u9n6/v7+/v/+/v7+//////7+/v7+/v7+/v7+/8fg+v4jhPT+HYH0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P+hy/n//v78///////////////////////+/v7/2er8/y+L9P8cgPP/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoL0/oC4+P/+/v3+/v7+/v/////+/v7+//////3+/f7q8/v+PZL1/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+B9P8bgPP+aaz2/vz9/f/+/v3+/v7+/v/////+/v7+/v7+//T5+/5Qnfb+G4Dz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h6B8/9Rnvb+9fn7/v/////+/v7+/v7+/v/////+/v7++/39/2eq9v4af/P+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/zqR9f/s9Pz////////////////////////////+/vz/gbj4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8bgPP+L4v0/tzs+//+/v3+/v7+/v/////+/v7+/v7+/v7+/f+fyvn+G4Dz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8khfT+yOD5/v3+/v/+/v7+/v7+/v/////+/v7+/v7+/rnY+v8egfP+H4Hz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/xyA9P9UoPX/h7z4/2qs9v8ihPT/HoH0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x2B8/+w0/r//f79//////////////////////////3/z+T7/ymI9P8egfP/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfT+HoHz/ou/+P/9/vz+///8//7+/P7H4Pv+IoPz/h+C9P8egfP+HoHz/h+C9P8egfT+HoHz/o/B+P/+/vz+/v7+/v/////+/v7+/v7+/v/////6/P3+Spr1/huA8/8cgPP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfT+MIv0/vj7/f/+/v7+//////7+/v7+/vz+Zqr2/h+C9P8egfP+HoHz/h+C9P8dgfP+MYz0/vj7/f/+/v7+/v7+/v/////+/v7+/v7+/v/////+/v3+9fr8/pvH+P8piPT+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8dgfP/SJn1//3+/v/+/v7///////////////////////////////////////3+/f/d7fz/Q5f1/x6C9P8egfT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+JIX0/ufy/P/+/v3+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v7+/v/+/v3+8vj8/1Wg9v4bgPP+HoHz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/k6c9f/j8Pz+/f79/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+//////H3+/5GmPX+HoHz/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8ig/T/P5T1/1ag9v+Buff/yOD5//r9/f/+//7////////////////////////////e7Pz/JYX0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HYHz/huA8/8af/P+G3/z/lOf9v/a6vz+/v78/v/////+/v7+//////7+/v7+/vz+lcT4/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h2B8/8nh/T+w976/v/////+/v7+//////7+/v7+/v7+9fr9/zeP9P4dgfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP/LIn0/9rr+//+/v3//////////////////////5HB+P8Zf/P/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfT+HoHz/lSg9v/+/v3+//////7+/v7+/v7+/////9rq+v4bgPP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/hyA8//O5Pv+//////7+/v7+/v7+//////r8+/42j/T+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C8/+GvPj//v79//////////////////z+/P9dpfb/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h6B8/9cpPb+/P78//7+/v7+/v7+//////3+/f52s/f+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P9OnPb//P78//////////////////3+/f9+t/j/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P9bpPb+/P79//7+/v7+/v7+//////3+/f52s/f+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h2B8/+Fu/j+/f79//7+/v7+/v7+//////z+/P5epfb+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C8//L4vv//f7+//////////////////r8/P84j/X/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/k+d9f/9/v3+//////7+/v7+/v7+/////9vr+f4bgPP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+KIf0/tfp+//+/v3+//////7+/v7+/v7+/v7+/5PD9/4bf/P+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1//////////////////////////z/hbv4/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8nhvT/wNz5//3+/f/+//7////////////+/v7/9/v9/ziQ9P8cgPP/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/vz+hbv4/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8dgfP+HoH0/kmZ9f/V6Pv+/f79/v/////+/v7+//////7+/v7+/vz+mcb5/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/v3+mMb5/j+U9f8/lPX+P5T1/j+U9f8/lPX+P5T1/j+U9f8/lPX+O5L1/kyb9v94tPf+wd36/v39/f/+/v3+/v7+/v/////+/v7+//////7+/f7g7vz+KIf0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8cgPP/Spr1///////////////////////+/v7//P79//3+/P/9/vz//f78//3+/P/9/vz//f78//3+/P/9/vz//P78//z+/P/9/v3//f79//////////////////////////////////H4/P9KmvX/HYH0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgPP+Spr1/v/////+/v7+//////7+/v7+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v3+8vj8/12k9v4dgfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8cgfP+Spr1/v7+/v/+/v7+//////7+/v7+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v///P/i7/z+S5v2/x2B8/4dgfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8dgfT/L4v0//j8/f/+/v7////////////////////////////////////////////////////////////////////////////////////////////+/v7/+fz9/57J+f8qiPT/HYHz/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8fgvT/H4L0/x+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/oq++P/8/fz+/f79//7+/v7+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/v7+/v/////+/v7+/f7+/v3+/f/9/vz++/38/uPv+v+bx/j+PZP1/h+C9P8egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/ht/8/9VoPb+ir74/47A+f6OwPn+jsD5/o7A+f+OwPn+jsD5/o7A+f+OwPn+jsD5/o7A+f+OwPn+jcD4/oS7+P9qrPf+QZX1/h6B8/8af/P+HIDz/h+C9P8egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+HoHz/h+C9P8egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+H4L0/x6B8/4egfP+HoHz/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAgAAAAQAAAAAEAIAAAAAAAgBAAAAAAAAAAAAAAAAAAAAAAAAAegfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4jhPT+MYz0/iGD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+IYLz/pjG9/7F3/n+ib33/iqI9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iqI9P6bx/j+/v7+/v7+/v73+v3+Y6j2/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+gbj3/vL3/f7+/v7+/v7+/vf6/f5kqPb+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+IYPz/mqs9v77/f3+/v7+/v7+/v7+/v7+n8r4/iuJ9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/5YofX+3+37/v7+/v7+/v7+/v79/szi+/4xjPT+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+Rpf1/uny/P7+/v7+/v7+/v7+/v7H4Pr+P5T1/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/juS9f7B3Pr+/v7+/v7+/v7+/v7+7fX9/kua9f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4uivT+xd76/v7+/f7+/v7+/v7+/uPv+/5epPb+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+KYfz/pnG9/7+/v7+/v79/v7+/v78/f3+crD2/iKD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iKD8/6bx/j++vz9/v7+/v7+/v7+8/j9/om99/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4fgvP+bq72/vb6/f7+/v3+/v7+/v7+/v6jy/n+LIjz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoH0/h6B8/5ao/b+o8z4/oW79/4yjPT+HoHz/h6B8/4egfT+HoHz/nCv9v7s9Pz+/v7+/v7+/v7+/v7+wNz6/iKD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfT+JoXz/uHu/P7+/v3+9/r8/oO69/4egfP+HoHz/h6B8/4mhfP+4u/8/v7+/f7+/v7+/v7+/v7+/v7R5fr+V6H1/iCD8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/jGM9P74+/3+/v7+/v7+/v7+/v7+/v7+/v7+/v72+v3+oMv5/imI9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+H4Hz/qTM+f73+v3+/v7+/v7+/v7+/v7+/v7+/v7+/v77/f3+kMH3/iaG8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+H4Lz/i2J9P5LmvX+frf2/tLm+/76/P3+/v7+/v7+/v73+v3+f7f3/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/h6B8/4egfP+HYHz/h2B8/4cgPP+QJT0/rDT+f7+/v7+/v7+/v7+/f7i7/z+KIfz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+JITz/sjg+v7+/v7+/v7+/v7+/v55tPb+HYHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+aav2/vT4/f7+/v7+/v7+/q7S+P4jhPP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/48kvT+0OX6/v7+/v7+/v7+yuH6/jaP9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jCL9P7D3vr+/v7+/v7+/v7R5fv+PZP1/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+N4/0/svi+v7+/v7+/v7+/s3j+v45kPT+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+rdH5/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/5QnfX+5PD8/v7+/v7+/v7+vtr5/iuI9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/f6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+IILz/qfO+f7+/v7+/v7+/v7+/v6Lvvb+HYHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v79/q3R+f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iCC8/5qq/b+9Pn8/v7+/v7+/v7++vz9/kKV9P4dgfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/46kfT+/v7+/v7+/v7+/v3+sdP5/imH9P4ph/P+KYf0/imH8/4ph/T+KIbz/jKM9P5Mm/X+pMz5/vT5/P7+/v7+/v7+/vr8/f6eyPj+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/jqR9P7+/v7+/v7+/v7+/v7m8fz+vdr5/r3a+f692vn+vdr5/r3a+f682vn+xt/6/uDu+/7+/v7+/v7+/v7+/v7+/v7+zOP6/j+U9f4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+OpH0/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7++/39/s3j+v45kPT+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4ui/T++/39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/vv9/f6hyvj+QJT0/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/6Euvf+0OX6/tjp/P7Y6fz+2en8/tjp/P7Z6fz+2On8/tnp/P7Y6fz+0eb7/sLd+f6Qwff+Rpj1/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iOE8/48kvT+Q5b1/kOW9f5DlvX+Q5b1/kOW9f5DlvX+Q5b1/kOW9P49k/X+Lorz/h6B8/4dgPP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAEAAAACAAAAABACAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAAAAHoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+bK32/jyS9P4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+jr/4/v7+/v6t0fn+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+cK/2/v39/f7x9/3+Rpj0/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+WKH1/vj7/f75+/3+W6P1/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+Q5b0/u/2/P79/f3+dbH2/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+M43z/uLu+/7+/v7+ksL4/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4ggvP+t9b5/oy+9/4egfP+IILz/s/k+v7+/v7+4+/8/i2K8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+LInz/v7+/v7V5/v+HoHz/iOD8/7k7/z+/v7+/v7+/v7j8Pz+P5T0/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/iyJ8/7+/v7+1ef7/h6B8/4egfP+IYPz/kCU9P6v0vn+/v7+/tXn+/4ggvP+HoHz/h6B8/4egfP+HoHz/h6B8/4sifP+/v7+/tXn+/4egfP+HoHz/h6B8/4egfP+H4Hz/sjg+v7+/v7+WaL1/h6B8/4egfP+HoHz/h6B8/4egfP+LInz/v7+/v7V5/v+HoHz/h6B8/4egfP+HoHz/h6B8/5/uPf+/v7+/oO69/4egfP+HoHz/h6B8/4egfP+HoHz/iyJ8/7+/v7+1ef7/h6B8/4egfP+HoHz/h6B8/4egfP+jb/3/v7+/v57tfb+HoHz/h6B8/4egfP+HoHz/h6B8/4sifP+/v7+/tXn+/4egfP+HoHz/h6B8/4egfP+Mozz/uXw/P79/f3+QZX0/h6B8/4egfP+HoHz/h6B8/4egfP+LInz/v7+/v7k8Pz+c7D2/nOw9v5ysPb+ib33/uXw/P7+/v7+qM75/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/imH8/79/f3+/v7+/v7+/v7+/v7+/v7+/v7+/v79/f3+qs/4/iSE8/4egfP+HoHz/h6B8/4egfP+HoHz/h6B8/4egfP+bK32/o2/+P6Nv/j+jb/4/o2/+P5/uPf+RJb0/h6B8/4egfP+HoHz/h6B8/4egfP+HoHz/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
          alt=""
        />
      )}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=Noto+Sans+SC:wght@300;400;700;900&display=swap";
  document.head.appendChild(linkEl);
};

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  return (
    <div
      className={
        styles.container +
        ` ${
          config.tightBorder && !isMobileScreen
            ? styles["tight-container"]
            : styles.container
        } ${getLang() === "ar" ? styles["rtl-screen"] : ""}`
      }
    >
      {isAuth ? (
        <>
          <AuthPage />
        </>
      ) : (
        <>
          <SideBar className={isHome ? styles["sidebar-show"] : ""} />

          <div className={styles["window-content"]} id={SlotID.AppBody}>
            <Routes>
              <Route path={Path.Home} element={<Chat />} />
              <Route path={Path.NewChat} element={<NewChat />} />
              <Route path={Path.Masks} element={<MaskPage />} />
              <Route path={Path.Chat} element={<Chat />} />
              <Route path={Path.Settings} element={<Settings />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
