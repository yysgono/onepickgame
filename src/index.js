// Keep the initial entry small. Preserve server HTML while the React app downloads.
import { bootAfterPaint } from "./utils/bootAfterPaint";

bootAfterPaint(() => import("./mountApplication"));
