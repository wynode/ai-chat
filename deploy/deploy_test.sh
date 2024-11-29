# yarn run export
rsync -r deploy/nginx.test.conf lighthouse@chengdu:/home/lighthouse/chatgpt
rsync -r out lighthouse@chengdu:/home/lighthouse/chatgpt
