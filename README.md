# Chat backend for Software Architecture course

login flow:

- local.strategy:validate() -> authService:validateUser() - attach user info to req -> auth.controller:login() -> auth.service:login(): return jwt