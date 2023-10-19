cd ./wasm && \
GOOS=js GOARCH=wasm go build -o ../crowdsec-playground/public/main.wasm && \
cd ../crowdsec-playground/ && \
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ./public/wasm_exec.cjs && \
PUBLIC_URL=/ NODE_ENV="development" npm run dev
