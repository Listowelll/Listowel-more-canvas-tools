import { ALWAYS } from "userscripter/lib/environment";
import { Stylesheets, stylesheet } from "userscripter/lib/stylesheets";

const STYLESHEETS = {
    main: stylesheet({
        condition: ALWAYS,
        css: `
            .mct-feedback-glow-assignment {
                border-left: 4px solid #f59e0b !important;
                background: rgba(255, 243, 205, 0.35) !important;
            }

            .mct-feedback-glow-view-link {
                display: inline-block;
                margin-left: 0.5rem;
                padding: 0.2rem 0.55rem;
                border: 1px solid #f59e0b;
                border-radius: 999px;
                font-size: 0.75rem;
                font-weight: 600;
                color: #7c3a06 !important;
                background: #fff7e6;
                text-decoration: none;
                animation: mct-feedback-pulse 1.8s ease-out infinite;
            }

            .mct-feedback-glow-view-link:hover {
                background: #ffefc9;
                color: #7c3a06 !important;
                text-decoration: none;
            }

            @keyframes mct-feedback-pulse {
                0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.45); }
                70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
                100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
            }
            
        `,
    }),
} as const;

// This trick uncovers type errors in STYLESHEETS while retaining the static knowledge of its properties (so we can still write e.g. STYLESHEETS.foo):
const _: Stylesheets = STYLESHEETS; void _;

export default STYLESHEETS;
