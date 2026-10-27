import { useContext, useEffect } from "react";
import { siteOrigin } from "../config/site";
import { HeadSinkContext, OriginContext, type HeadSnapshot } from "./context";
import { applyHead, renderHead, type HeadInput } from "./meta";

export function Head(input: HeadInput) {
  const origin = useContext(OriginContext) ?? siteOrigin();
  const sink = useContext(HeadSinkContext);
  const status = input.status ?? 200;
  const snapshot: HeadSnapshot = {
    title: input.title,
    description: input.description,
    path: input.path,
    robots: input.robots,
    jsonLd: input.jsonLd,
    status,
    html: renderHead({ ...input, status }, origin),
  };
  // Request-scoped slot. renderToString is synchronous, so this records the page head.
  // eslint-disable-next-line react-hooks/immutability -- not React state; the server reads it after render
  if (sink) sink.current = snapshot;

  const json = input.jsonLd ? JSON.stringify(input.jsonLd) : "";
  const robots = input.robots ?? "";
  useEffect(() => {
    applyHead(
      {
        title: input.title,
        description: input.description,
        path: input.path,
        robots: input.robots,
        status,
        jsonLd: json ? (JSON.parse(json) as Record<string, unknown>) : null,
      },
      origin,
    );
  }, [input.title, input.description, input.path, robots, status, json, origin, input.robots]);

  return null;
}
