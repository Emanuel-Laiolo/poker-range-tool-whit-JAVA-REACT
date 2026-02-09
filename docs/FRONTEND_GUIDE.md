# Frontend guide (React)

This guide answers the common question:
> "Where are the features? Are there classes? attributes? components?"

## React mental model
In React, your app is made of **components**.

A component is usually a **function** that returns JSX:

```jsx
function MyComponent(props) {
  return <div>Hello</div>;
}
```

### Are there classes in React?
- Historically, React had **class components** (`class MyComp extends React.Component`).
- Modern React uses **function components + hooks** (`useState`, `useEffect`, etc.).
- In this project we use function components.

### What are "attributes"?
In React, when you write:

```jsx
<RangeGrid range={range} onPaint={paint} />
```

Those are called **props** (properties). They are the "inputs" to a component.

### Where is the state?
State is created with `useState`:

```js
const [range, setRange] = useState(...)
```

- `range` is the current value
- `setRange` updates it
- Updating state triggers a re-render.

## Project structure

- `frontend/src/App.jsx`
  - The main component (page layout)
  - Holds the main state: current range, selected hand, layers, saved list, errors

- `frontend/src/components/*`
  - Reusable UI components:
    - `RangeGrid.jsx` (13x13 grid)
    - `LayerControls.jsx` (4 layers: action + %)
    - `StatsPanel.jsx` (VPIP + per action)

- `frontend/src/range/*`
  - Pure JS logic (no UI):
    - contract normalization (weights sum to 100)
    - validation
    - stats

- `frontend/src/api/*`
  - Small wrappers around `fetch` to call the Java backend

## Core flow (painting)
1) User chooses actions+weights in the sidebar (layers)
2) React converts layers -> list of actions with weights (summing to 100)
3) User clicks/drags on the grid
4) The selected hand is updated in `range.hands[handKey]`

## Core flow (saving)
1) `validateRange(range)` locally
2) `POST /api/ranges/validate` (server validation)
3) `POST /api/ranges` or `PUT /api/ranges/{id}`
4) Refresh list

If you want to understand the app fastest:
1) Read `App.jsx`
2) Read `range/model.js`
3) Read `components/RangeGrid.jsx`
4) Read `api/ranges.js`
