// src/components/Loader.jsx
import React from "react";
import styled, { css } from "styled-components";

const LoadingSpinner = ({
  size = 100,         // px or e.g. "6rem"
  hue = 210,          // 0–360 (accent color)
  border = 10,        // px thickness of the arc
  speed = 1,          // seconds per rotation
  blur,               // defaults to = border
  fullScreen = false, // fixed, covers the whole page
  overlay = false,    // absolute, covers parent (parent should be relative)
  label = "Loading…",
  className,
}) => {
  return (
    <StyledWrapper
      className={className}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      $size={size}
      $hue={hue}
      $border={border}
      $speed={speed}
      $blur={blur}
      $fullScreen={fullScreen}
      $overlay={overlay}
    >
      <div className="loader">
        <span className="sr-only">{label}</span>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  ${({ $fullScreen, $overlay }) =>
    $fullScreen
      ? css`
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          background: #F2F2F2;
          color: #fff; /* spinner color on dark backdrop */
        `
      : $overlay
        ? css`
          position: absolute;
          inset: 0;
          z-index: 50;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(1px);
          color: #fff;
        `
        : css`
          display: inline-grid; /* inline by default = no layout shift */
          place-items: center;
        `}

  /* CSS variables fed by props */
  .loader {
    --hue: ${({ $hue }) => $hue};
    --size: ${({ $size }) => (typeof $size === "number" ? `${$size}px` : $size)};
    --border: ${({ $border }) =>
    typeof $border === "number" ? `${$border}px` : $border};
    --speed: ${({ $speed }) =>
    typeof $speed === "number" ? `${$speed}s` : $speed};
    --blur: ${({ $blur, $border }) =>
    $blur != null
      ? typeof $blur === "number"
        ? `${$blur}px`
        : $blur
      : typeof $border === "number"
        ? `${$border}px`
        : $border};

    /* Dot that rides the ring */
    width: var(--border);
    aspect-ratio: 1;
    background: currentColor;
    border-radius: 50%;
    position: relative;
    --y: calc((var(--size) * -0.5) + (var(--border) * 0.5));
    transform: rotate(0deg) translateY(var(--y));
    animation: spin var(--speed) infinite linear;
    color: hsl(var(--hue), 90%, 60%); /* spinner accent */
  }

  .loader::before {
    content: "";
    position: absolute;
    inset: calc(var(--border) * -0.5);
    border-radius: 50%;
    background: currentColor;
    filter: blur(var(--blur));
    opacity: 0.5;
    z-index: -1;
  }

  .loader::after {
    content: "";
    width: var(--size);
    aspect-ratio: 1;
    position: absolute;
    top: 0%;
    left: 50%;
    translate: -50% 0;
    background: conic-gradient(
      white,
      hsl(var(--hue), 100%, 70%),
      hsl(var(--hue), 100%, 10%),
      transparent 65%
    );
    border-radius: 50%;
    mask: radial-gradient(
      transparent calc(((var(--size) * 0.5) - var(--border)) - 1px),
      white calc((var(--size) * 0.5) - var(--border))
    );
  }

  @keyframes spin {
    to {
      transform: rotate(-360deg) translateY(var(--y));
    }
  }

  /* Screen-reader only utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

export default LoadingSpinner;
