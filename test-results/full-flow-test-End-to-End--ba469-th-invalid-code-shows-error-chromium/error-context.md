# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "Back to Dashboard" [ref=e4] [cursor=pointer]:
      - /url: /dashboard
      - img [ref=e5]
      - generic [ref=e7]: Back to Dashboard
    - generic [ref=e8]:
      - img [ref=e10]
      - heading "Join a League" [level=1] [ref=e13]
      - paragraph [ref=e14]: Enter your invite code to join
    - generic [ref=e15]:
      - generic [ref=e16]: You must be logged in. Please refresh and try again.
      - generic [ref=e18]:
        - paragraph [ref=e19]: "Available Invite Codes:"
        - button "Show" [ref=e20]
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Invite Code
          - generic [ref=e24]:
            - img [ref=e25]
            - textbox "ABC12345" [ref=e28]: INVALID1
        - button "Join League" [ref=e29] [cursor=pointer]
  - alert [ref=e30]
```