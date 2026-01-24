import styled from "styled-components";

export const PlayerShell = styled.div`
  border-radius: 50%;
  overflow: hidden;
  background: #000;
  border: 5px solid var(--tg-border);
  height: auto;
  aspect-ratio: 1 / 1;
  width: 95%;
  max-width: 100%;
  margin: 12px auto 0;
  margin-bottom: 20px;
  position: relative;
`;

export const PlayerVideo = styled.video`
  width: 100%;
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
`;

export const ReplayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: transparent;
  cursor: pointer;
`;
