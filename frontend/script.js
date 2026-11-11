const chat = document.getElementById("chat");
const input = document.getElementById("query");
const button = document.getElementById("send");
const status = document.getElementById("status");
const inputContainer = document.getElementById("input-container");
const threadIdElement = document.getElementById("thread-id");
const modelNameElement = document.getElementById("model-name");

const modelName = "openai/gpt-6-luna";
const threadId = globalThis.crypto?.randomUUID?.()
  ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let busy = false;
let dragStartY = null;
let dragPointerId = null;
let passedSnapThreshold = false;

threadIdElement.textContent = threadId;
modelNameElement.textContent = modelName;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInteger(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomToward(min, max, towardStart) {
  const amount = Math.pow(Math.random(), 1.35);
  return towardStart
    ? min + (max - min) * amount
    : max - (max - min) * amount;
}

function scatterBackgroundAssets() {
  const scatterGroup = document.querySelector("[aria-hidden='true']");
  const templates = [...scatterGroup.querySelectorAll(".scatter")];
  const assets = templates;
  const placements = [];
  const minimumDistance = Math.min(
    180,
    Math.max(100, Math.min(window.innerWidth, window.innerHeight) * 0.22)
  );
  const viewportPadding = 24;
  const centerExclusion = {
    left: window.innerWidth * 0.3,
    right: window.innerWidth * 0.7,
    top: window.innerHeight * 0.28,
    bottom: window.innerHeight * 0.72
  };
  const quadrants = [
    { left: 0, right: 0.5, top: 0, bottom: 0.5 },
    { left: 0.5, right: 1, top: 0, bottom: 0.5 },
    { left: 0, right: 0.5, top: 0.5, bottom: 1 },
    { left: 0.5, right: 1, top: 0.5, bottom: 1 }
  ];

  function candidateFor(quadrant, radius) {
    const xMin = viewportPadding + radius + window.innerWidth * quadrant.left;
    const xMax = window.innerWidth * quadrant.right - viewportPadding - radius;
    const yMin = viewportPadding + radius + window.innerHeight * quadrant.top;
    const yMax = window.innerHeight * quadrant.bottom - viewportPadding - radius;
    const edgeAxis = randomInteger(0, 2);
    const x = edgeAxis === 2
      ? randomBetween(xMin, xMax)
      : randomToward(xMin, xMax, quadrant.left === 0);
    const y = edgeAxis === 1
      ? randomBetween(yMin, yMax)
      : randomToward(yMin, yMax, quadrant.top === 0);
    const isOutsideCenter = (
      x + radius < centerExclusion.left ||
      x - radius > centerExclusion.right ||
      y + radius < centerExclusion.top ||
      y - radius > centerExclusion.bottom
    );
    const isFarEnough = placements.every(previous => {
      const distance = Math.hypot(x - previous.x, y - previous.y);
      return distance >= Math.max(minimumDistance, radius + previous.radius + 20);
    });

    return isOutsideCenter && isFarEnough ? { x, y, radius } : null;
  }

  assets.forEach((asset, index) => {
    const size = randomBetween(120, 180);
    const radius = Math.sqrt(2) * size / 2;
    let placement;
    const requiredQuadrant = index < quadrants.length
      ? quadrants[index]
      : quadrants[randomInteger(0, quadrants.length - 1)];

    for (let attempt = 0; attempt < 1000; attempt++) {
      placement = candidateFor(requiredQuadrant, radius);
      if (placement) {
        break;
      }
    }

    if (!placement) {
      placement = {
        x: randomBetween(
          viewportPadding + radius + window.innerWidth * requiredQuadrant.left,
          window.innerWidth * requiredQuadrant.right - viewportPadding - radius
        ),
        y: randomBetween(
          viewportPadding + radius + window.innerHeight * requiredQuadrant.top,
          window.innerHeight * requiredQuadrant.bottom - viewportPadding - radius
        ),
        radius
      };
    }

    placements.push(placement);
    asset.style.left = `${placement.x}px`;
    asset.style.top = `${placement.y}px`;
    asset.style.width = `${size}px`;
    asset.style.opacity = randomBetween(0.15, 0.35).toFixed(2);
    asset.style.transform = `translate(-50%, -50%) rotate(${randomBetween(-20, 20).toFixed(1)}deg)`;
  });
}

scatterBackgroundAssets();

function addMessage(text, type) {
  if (type === "agent") {
    const row = document.createElement("div");
    row.className = "agent-row";

    const avatar = document.createElement("img");
    avatar.className = "agent-avatar";
    avatar.src = "assests/logo.png";
    avatar.alt = "Agent";

    const div = document.createElement("div");
    div.className = "message agent";
    div.textContent = text;

    row.appendChild(avatar);
    row.appendChild(div);
    chat.appendChild(row);

    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;

  chat.appendChild(div);

  window.scrollTo(0, document.body.scrollHeight);
  return div;
}

async function send() {
  const query = input.value.trim();

  if (!query || busy) return;

  busy = true;

  document.body.classList.add("started");

  button.disabled = true;
  input.disabled = true;

  addMessage(query, "user");
  input.value = "";

  const response = addMessage("Thinking...", "agent");

  status.textContent = "PROCESSING";

  try {
    const params = new URLSearchParams({
      query,
      model_name: modelName,
      thread_id: threadId
    });
    const res = await fetch(
      `http://localhost:8000/croissant?${params.toString()}`,
      { method: "POST" }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    response.textContent = await res.text();

  } catch (err) {
    response.textContent = `Error: ${err.message}`;

  } finally {
    busy = false;

    button.disabled = false;
    input.disabled = false;

    status.textContent = "";

    input.focus();

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }
}

function snapHandle(toBottom) {
  button.style.top = toBottom
    ? "var(--handle-bottom)"
    : "var(--handle-top)";
}

function handlePointerDown(event) {
  if (busy) return;

  dragStartY = event.clientY;
  dragPointerId = event.pointerId;
  passedSnapThreshold = false;
  button.classList.add("is-dragging");
  button.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (dragPointerId !== event.pointerId || dragStartY === null) return;

  const bounds = inputContainer.getBoundingClientRect();
  const handleHeight = button.getBoundingClientRect().height;
  const handleStyles = getComputedStyle(button);
  const topLimit = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-top")) / 100);
  const bottomLimit = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-bottom")) / 100);
  const halfHandle = handleHeight / 2;
  const handleCenter = event.clientY - bounds.top;
  const snapThreshold = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-snap-threshold")) / 100);
  const hasText = Boolean(input.value.trim());

  if (hasText && (passedSnapThreshold || handleCenter >= snapThreshold)) {
    passedSnapThreshold = true;
    snapHandle(true);
    event.preventDefault();
    return;
  }

  const position = handleCenter - halfHandle;
  const maximumPosition = bottomLimit - halfHandle;
  const resistanceStart = topLimit + (maximumPosition - topLimit) * 0.72;
  const resistance = parseFloat(
    handleStyles.getPropertyValue("--handle-resistance")
  );
  const resistedPosition = position > resistanceStart
    ? resistanceStart + (position - resistanceStart) * resistance
    : position;
  const clampedPosition = Math.max(
    topLimit - halfHandle,
    Math.min(maximumPosition, resistedPosition)
  );

  button.style.top = `${(clampedPosition / bounds.height) * 100}%`;
  event.preventDefault();
}

function handlePointerUp(event) {
  if (dragPointerId !== event.pointerId || dragStartY === null) return;

  const bounds = inputContainer.getBoundingClientRect();
  const handleStyles = getComputedStyle(button);
  const snapThreshold = bounds.height *
    (parseFloat(handleStyles.getPropertyValue("--handle-snap-threshold")) / 100);
  const releasedBelowThreshold = event.clientY - bounds.top >= snapThreshold;
  const shouldSnapToBottom = Boolean(input.value.trim()) &&
    (passedSnapThreshold || releasedBelowThreshold);
  button.releasePointerCapture(event.pointerId);
  button.classList.remove("is-dragging");
  dragStartY = null;
  dragPointerId = null;

  if (shouldSnapToBottom) {
    snapHandle(true);
    if (input.value.trim()) {
      send();
    }
  } else {
    snapHandle(false);
  }

  passedSnapThreshold = false;
}

button.addEventListener("pointerdown", handlePointerDown);
button.addEventListener("pointermove", handlePointerMove);
button.addEventListener("pointerup", handlePointerUp);
button.addEventListener("pointercancel", handlePointerUp);

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});
