go build -o ./server ./http/main.go && \
rm -rf ./main.wasm && \
cd ./wasm && rm -rf ./main.wasm && \
GOOS=js GOARCH=wasm go build -o main.wasm && \
cp ./main.wasm ../ && \
cd .. && \
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" . && \
./server
