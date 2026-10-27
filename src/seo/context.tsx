import { createContext } from "react";
import type { HeadInput } from "./meta";
import type { RoutePayload } from "./routeData";
import { emptyRouteData } from "./routeData";

export type HeadSnapshot = HeadInput & { html: string };

export const OriginContext = createContext<string | null>(null);
export const HeadSinkContext = createContext<{ current: HeadSnapshot | null } | null>(null);
export const RouteDataContext = createContext<RoutePayload>(emptyRouteData());
