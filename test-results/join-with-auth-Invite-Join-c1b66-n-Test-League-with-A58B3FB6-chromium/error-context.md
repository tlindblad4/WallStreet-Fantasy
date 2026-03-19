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
      - generic [ref=e17]: Invalid login credentials
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: Email
          - generic [ref=e21]:
            - img [ref=e22]
            - textbox "you@example.com" [ref=e25]: testjoiner@example.com
        - generic [ref=e26]:
          - generic [ref=e27]: Password
          - generic [ref=e28]:
            - img [ref=e29]
            - textbox "Enter your password" [ref=e32]: password123
        - link "Forgot password?" [ref=e34] [cursor=pointer]:
          - /url: /forgot-password
        - button "Sign In" [ref=e35] [cursor=pointer]
      - paragraph [ref=e37]:
        - text: Don't have an account?
        - link "Sign up" [ref=e38] [cursor=pointer]:
          - /url: /register
  - alert [ref=e39]
```