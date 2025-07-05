# Gamification Patterns

## Overview
This document outlines the gamification patterns, UI components, and scoring logic for creating an engaging fitness experience.

## 🔧 Frameworks & Component Libraries

### 1. **shadcn/ui**
- Built on **Radix + Tailwind**
- Great components for:
  - `Progress` bars
  - `Card`, `Badge`, `Popover`, `Tooltip`, `Dialog`
  - `Tabs`, `Accordion`, `Drawer`
- Dark mode and accessibility baked in

✅ Use it for: **dashboard layout, modals, profile drawer, progress bars**

### 2. **Framer Motion**
- Animation framework for React — beautiful, declarative motion
- Animate XP gains, point popups, level up
- E.g. `+27 XP` floats up, fades out
- Smooth transitions between tabs/views

✅ Use it for: **XP animations, stat reveals, weekly recap flyouts**

### 3. **Lucide Icons**
- Open-source icon set, already integrated into shadcn
- Use for:
  - Muscle groups (`dumbbell`, `run`, `target`)
  - Progress markers (`check`, `clock`, `fire`, `trending-up`)
  - Tabs for Nutrition / Exercise / Progress

✅ Use it for: **clean gamification visuals with semantic clarity**

### 4. **Recharts or Nivo**
- Charting libraries that are sleek and responsive
- Recharts = easier + lighter
- Nivo = more visual options (e.g., radar charts)

✅ Use it for: **progress graphs per muscle group, XP by week, PRs over time**

### 5. **Tremor UI**
- Minimal analytics-focused component set (very sexy for stat dashboards)
- Progress tracking cards
- Score deltas ("↑ +35 points since last week")
- Bar and area charts
- Great for weekly wrap-ups or coach dashboards

✅ Use it for: **weekly summary view or profile stats section**

## 🔥 Gamified UI Components

### 🎯 1. **XP Toast + Milestone Pop**
```tsx
<Toast>
  +42 XP • First push today!
</Toast>
```
- Use `shadcn/toast` with `framer-motion` slide-up
- Stackable if user logs multiple things quickly

### 📊 2. **Dynamic Progress Grid**
Grid view of major muscle groups with progress fill + color states:
```tsx
<Grid>
  <Card title="Chest" fill="80%" color="green" />
  <Card title="Back" fill="40%" color="yellow" />
</Grid>
```
- Tooltip on hover: *"Worked 3x this week. Ideal: 4 sets/day × 3 days"*

### 🧠 3. **Smart Suggestions Box**
"What's Next?" box with rotating card suggestions:
```tsx
<Popover>
  You haven't done legs in 4 days. Squats? 🦵
</Popover>
```
Pull from logic rules (neglected categories, variety prompts)

### 🏅 4. **Weekly Quests Tracker**
Use `Tabs` or `Accordion`:
- *Complete 5 push workouts* ✅
- *Try a new core move* ❌
- *Run 2x this week* 🏃

Includes:
- Checkboxes
- Progress fill bar
- Optional surprise XP rewards

### 👤 5. **Profile Drawer or Flyout**
Not a full page, but a drawer on click:
```tsx
<Drawer>
  <UserAvatar />
  <Fitness Score: 1560>
  <Streak: 🔥 4 days>
  <Quests: 3/5 complete>
</Drawer>
```
Use `shadcn/drawer` + `badge` + `progress` + icons

## 🧱 Component Organization

```txt
/components
  /Gamification
    - XPToast.tsx
    - WeeklyQuests.tsx
    - SmartPromptCard.tsx
  /Progress
    - MuscleGroupBar.tsx
    - ScoreTrendChart.tsx
  /Profile
    - ProfileDrawer.tsx
    - StreakBadge.tsx
```

Make each component self-contained with its own logic.

## 🎯 Advanced Scoring Logic

### Key Principles

1. **Each log returns a score**, which is a function of:
   - 🎯 Effort (sets × reps × weight or duration)
   - 🧱 Category balance
   - 🔁 Diminishing returns
   - 🔥 Milestones & variety bonuses

2. **Point decay only kicks in after healthy volume**
   - Set 1 and 2: full value
   - Set 3: slight decay
   - Set 4+: sharply reduced return

### Base Scoring Logic (Pseudocode)

```ts
function scoreLog(log: ExerciseLog, context: ScoringContext): number {
  const base = calculateEffortPoints(log)           // raw effort
  const decay = getCategoryDecay(log, context)       // diminishing returns
  const bonuses = getMilestoneBonuses(log, context)  // variety, first of day, etc.

  const adjusted = base * decay

  // Floor all adjusted effort points to minimum
  const minimum = log.type === "cardio" ? 5 : 1
  const finalEffort = Math.max(adjusted, minimum)

  return finalEffort + bonuses
}
```

### Effort Calculation

```ts
effort = sets × reps × effortMultiplier

effortMultiplier:
  compound: 1.5
  isolation: 1.0
  bodyweight: 0.8
  cardio: time in minutes × 0.8
```

You can apply relative weight scaling later — for now this keeps it fair across types.

### Diminishing Returns (Per Category)

```ts
function getCategoryDecay(log, context) {
  const setsToday = context.todaySetsByCategory[log.category] || 0

  if (setsToday <= 2) return 1.0        // no decay
  if (setsToday <= 4) return 0.75
  if (setsToday <= 8) return 0.4
  if (setsToday <= 16) return 0.1
  return 0.01 // still trackable, but trivial
}
```

- Kicks in only after 2 full-value sets
- Makes 1000 pushups = almost nothing after the first 100

### Milestone Bonuses

```ts
function getMilestoneBonuses(log, context) {
  let bonus = 0

  if (isFirstWorkoutToday(log, context)) bonus += 20
  if (isFirstOfCategoryToday(log, context)) bonus += 15
  if (isFirstTimeDoingExercise(log, context)) bonus += 50
  if (hasNotDoneCategoryInDays(log, context, 3)) bonus += 25
  if (hitAllCategoriesToday(context)) bonus += 40

  return bonus
}
```

> These are fixed value chunks — meant to reward behavior, not effort quantity.

## 🔐 Abuse Guardrails

| Behavior                | Logic Preventing Abuse                                 |
| ----------------------- | ------------------------------------------------------ |
| 1000 pushups            | Diminishing returns (decays to 0.01)                   |
| Logging same move 20x   | No bonuses repeat after first entry                    |
| Logging only core daily | Muscle group decay + recency bonuses encourage balance |
| "Fake logs" spammed     | Future: throttle via time or auto-detect               |

## 💾 Future-Proof Enhancements (Deferred)

- Weight-based score scaling (`weight / maxWeightInPast3mo`)
- Effort-intensity score (`volume / bodyweight`)
- PR-based bonus (`> last best by 10% = +25 points`)
- Fitness XP over trailing 7 days = rolling level
- Per-category weekly quests or score caps
- Performance decay if you skip a week (soft reset)

## 🔧 Suggested File Structure

```
/scoring
  - scoreLog.ts
  - effortPoints.ts
  - categoryDecay.ts
  - milestoneBonuses.ts
  - scoringConstants.ts
```

## 🎯 Implementation Guidelines

### When Adding Gamification Features

1. **Follow the established patterns** from `01-patterns.md`
2. **Use the scoring logic** outlined above for XP calculation
3. **Implement abuse prevention** from the start
4. **Keep components self-contained** with their own logic
5. **Test thoroughly** using `05-testing-strategy.md`

### When Duplicating Gamification Features

1. **Copy the exact scoring patterns** from `03-copy-patterns.md`
2. **Maintain the same abuse prevention** logic
3. **Use the same UI component patterns** for consistency
4. **Test the new feature** works exactly like the original

### Integration with Existing Systems

1. **Hook into exercise logging** via `04-integration-patterns.md`
2. **Update user profiles** with new XP and level data
3. **Persist gamification data** in Firestore following `01-patterns.md`
4. **Handle errors gracefully** using patterns from `02-common-bugs.md` 