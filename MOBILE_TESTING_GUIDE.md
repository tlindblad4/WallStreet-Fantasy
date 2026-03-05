# WallStreet Fantasy Mobile - Testing Guide
## Step-by-Step Instructions for First-Time Users

---

## 📋 BEFORE YOU START - Checklist

Make sure you have:
- [ ] **Mac computer** (MacBook, iMac, Mac Mini, etc.)
- [ ] **iPhone or iPad** (for testing)
- [ ] **USB cable** to connect iPhone to Mac
- [ ] **Xcode installed** (free from Mac App Store)

**Don't have Xcode?**
1. Open Mac App Store
2. Search "Xcode"
3. Click "Get" (it's free, but large - takes time to download)

---

## 🚀 STEP-BY-STEP TESTING

### Step 1: Open Terminal

**How to open Terminal:**
- Press `Cmd + Space` (opens Spotlight)
- Type "Terminal"
- Press Enter

You'll see a black window with text. This is Terminal.

---

### Step 2: Navigate to Project

**In Terminal, type this exactly:**

```bash
cd ~/.openclaw/workspace/wallstreet-fantasy
```

**Press Enter**

You should see the prompt change to show you're in that folder.

---

### Step 3: Run Build Command

**Type this:**

```bash
./build-mobile.sh
```

**Press Enter**

**What you'll see:**
- Text scrolling by (this is normal)
- "Syncing with Capacitor..."
- "✅ Sync complete!"
- "Next steps: For iOS: npx cap open ios"

**If it asks "Press Enter to open iOS in Xcode":**
- Press Enter

---

### Step 4: Wait for Xcode to Open

**What happens:**
- Xcode (big app) will open
- It may take 30-60 seconds to fully load
- You'll see a window with file browser on left

**If Xcode doesn't open automatically:**

Type this in Terminal:
```bash
npx cap open ios
```

---

### Step 5: Connect Your iPhone

1. **Plug your iPhone into your Mac** with USB cable
2. **Unlock your iPhone** (enter passcode)
3. **On iPhone, you may see:** "Trust This Computer?"
   - Tap "Trust"
   - Enter your iPhone passcode

---

### Step 6: Select Your iPhone in Xcode

**Look at the top of the Xcode window:**

1. You'll see a dropdown menu (currently might say "iPhone 15 Pro" or similar)
2. **Click that dropdown**
3. **Select your actual iPhone** from the list (under "Device" section)
   - It will show your iPhone's name

![Xcode Target Selector](https://i.imgur.com/example.png)
*The dropdown at the top where you select your device*

---

### Step 7: Build and Run

**Click the "Play" button** (▶️) in the top-left of Xcode

**What happens:**
1. Xcode builds the app (30-60 seconds)
2. You'll see progress bar at top
3. App installs on your iPhone
4. App automatically opens on your iPhone!

---

### Step 8: Test the App

**On your iPhone:**
1. Look for "WallStreet Fantasy" app icon
2. **Tap to open it**
3. Try logging in
4. Try viewing your portfolio
5. Try trading

**That's it! You're testing the mobile app!** 🎉

---

## ⚠️ COMMON ISSUES & FIXES

### Issue 1: "Command not found" error

**Problem:** Terminal can't find the command

**Fix:** Make sure you typed the cd command correctly:
```bash
cd ~/.openclaw/workspace/wallstreet-fantasy
```

---

### Issue 2: Xcode shows "Signing" error

**Problem:** Need to set up code signing

**Fix:**
1. In Xcode, click on "App" in left sidebar
2. Click "Signing & Capabilities" tab
3. Check "Automatically manage signing"
4. Select your Apple ID from "Team" dropdown
   - If no Apple ID, click "Add Account..."
   - Sign in with your Apple ID (free, no developer account needed for testing)

---

### Issue 3: "Trust This Computer" keeps popping up

**Fix:**
1. Unplug iPhone
2. On iPhone: Settings > General > Reset > Reset Location & Privacy
3. Reconnect iPhone
4. Tap "Trust"

---

### Issue 4: App won't install

**Check:**
- iPhone unlocked?
- Trusted this computer?
- Selected correct device in Xcode?

**Try:**
1. Unplug and replug iPhone
2. Restart Xcode
3. Try again

---

### Issue 5: Build fails with errors

**What to do:**
1. Look at the error message in Xcode
2. Take a screenshot
3. Send it to me - I'll help fix it!

---

## 📝 WHAT TO TEST

Once the app is running, check these:

- [ ] **Login works** - Can you log in?
- [ ] **Dashboard loads** - See your leagues?
- [ ] **Portfolio values** - Showing correct amounts?
- [ ] **Trade button** - Can you click it?
- [ ] **Charts display** - Do charts load?
- [ ] **Scrolling smooth** - No lag when scrolling?
- [ ] **Buttons clickable** - Easy to tap buttons?

---

## 📸 IF SOMETHING BREAKS

**Take screenshots of:**
1. The error message in Xcode
2. Your iPhone screen (if app looks wrong)
3. Terminal output (if command fails)

**Send them to me and I'll fix it!**

---

## ✅ SUCCESS CHECKLIST

You've successfully tested the mobile app when:
- [ ] App installs on your iPhone
- [ ] App opens without crashing
- [ ] You can log in
- [ ] You can navigate around
- [ ] No major visual issues

---

## 🎯 AFTER TESTING

**Tell me:**
1. Did it install successfully?
2. Did it open?
3. What worked well?
4. What was broken?
5. How did it feel?

**Then we can:**
- Fix any issues
- Add native features
- Prepare for app store

---

## 💡 PRO TIPS

1. **First build takes longest** - Be patient (2-3 minutes)
2. **Keep iPhone unlocked** while testing
3. **Don't unplug** while building
4. **If stuck, restart Xcode** - Fixes most issues
5. **Google the error** - Xcode errors are usually documented

---

## 🆘 EMERGENCY CONTACT

**If completely stuck:**
1. Screenshot the error
2. Tell me what step you're on
3. I'll walk you through it

**You've got this!** 💪
