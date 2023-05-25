rm -rf ./server &&
go build -o ./server ./http/main.go && \
rm -rf ./main.wasm && \
cd ./wasm && \
GOOS=js GOARCH=wasm go build -o main.wasm && \
mv ./main.wasm ../ && \
cd .. && \
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" . && \
./server
