@echo off
npm run build 2>&1 > build.log
type build.log