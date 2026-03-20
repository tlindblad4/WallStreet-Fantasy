# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "Back to Home" [ref=e4] [cursor=pointer]:
      - /url: /
      - img [ref=e5]
      - generic [ref=e7]: Back to Home
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img [ref=e11]
        - generic [ref=e14]: WallStreet Fantasy
      - paragraph [ref=e15]: Sign in to your account
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Email
          - generic [ref=e20]:
            - img [ref=e21]
            - textbox "you@example.com" [ref=e24]
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - generic [ref=e27]:
            - img [ref=e28]
            - textbox "Enter your password" [ref=e31]
        - link "Forgot password?" [ref=e33] [cursor=pointer]:
          - /url: /forgot-password
        - button "Sign In" [ref=e34] [cursor=pointer]
      - paragraph [ref=e36]:
        - text: Don't have an account?
        - link "Sign up" [ref=e37] [cursor=pointer]:
          - /url: /register
  - alert [ref=e38]
```