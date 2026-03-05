import { getAllWithoutCourse, getBaseApiUrl, getBaseUrl, getCourseId } from "~src/canvas/settings";

type SubmissionFeedback = {
    assignment_id: number;
    submission_comments?: Array<{ author_id?: number; comment?: string }>;
    rubric_assessment?: Record<string, { comments?: string }>;
    full_rubric_assessment?: { data?: Array<{ comments?: string }> };
};

let feedbackAssignmentsPromise: Promise<Set<number>> | null = null;
let observerReady = false;

const ROW_GLOW_CLASS = "mct-feedback-glow-assignment";
const LINK_CLASS = "mct-feedback-glow-view-link";

function getCurrentUserId(): number | null {
    const env = (window as any).ENV || {};
    const direct = env.current_user_id || (env.current_user && env.current_user.id);
    if (typeof direct !== "number") return null;
    return direct;
}

function hasRubricFeedback(submission: SubmissionFeedback): boolean {
    if (submission.rubric_assessment) {
        const hasInlineRubric = Object.values(submission.rubric_assessment)
            .some(item => Boolean(item && item.comments && item.comments.trim()));
        if (hasInlineRubric) return true;
    }

    if (submission.full_rubric_assessment && Array.isArray(submission.full_rubric_assessment.data)) {
        const hasFullRubric = submission.full_rubric_assessment.data
            .some(item => Boolean(item && item.comments && item.comments.trim()));
        if (hasFullRubric) return true;
    }

    return false;
}

function hasCommentFeedback(submission: SubmissionFeedback, currentUserId: number | null): boolean {
    if (!Array.isArray(submission.submission_comments) || submission.submission_comments.length === 0) return false;
    if (currentUserId === null) return true;
    return submission.submission_comments.some(comment => comment.author_id !== currentUserId);
}

function hasFeedback(submission: SubmissionFeedback, currentUserId: number | null): boolean {
    return hasCommentFeedback(submission, currentUserId) || hasRubricFeedback(submission);
}

function loadFeedbackAssignments(): Promise<Set<number>> {
    if (feedbackAssignmentsPromise) return feedbackAssignmentsPromise;

    const courseId = getCourseId();
    const currentUserId = getCurrentUserId();
    const options = {
        "student_ids[]": ["self"],
        "include[]": ["submission_comments", "rubric_assessment", "full_rubric_assessment"],
    };

    feedbackAssignmentsPromise = new Promise(resolve => {
        const url = `${getBaseApiUrl()}courses/${courseId}/students/submissions`;
        getAllWithoutCourse($.get, url, options)
            .done((submissions: SubmissionFeedback[]) => {
                const feedbackAssignments = new Set<number>();
                submissions.forEach(submission => {
                    if (hasFeedback(submission, currentUserId)) {
                        feedbackAssignments.add(submission.assignment_id);
                    }
                });
                resolve(feedbackAssignments);
            })
            .fail(() => resolve(new Set<number>()));
    });

    return feedbackAssignmentsPromise;
}

function getAssignmentRows(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("li[id^='assignment_'], tr[id^='assignment_'], [data-assignment-id], li.assignment"));
}

function getAssignmentId(row: HTMLElement): number | null {
    if (row.dataset.assignmentId) {
        const parsed = Number.parseInt(row.dataset.assignmentId, 10);
        if (!Number.isNaN(parsed)) return parsed;
    }

    const rowIdMatch = (row.id || "").match(/assignment_(\d+)/);
    if (rowIdMatch) return Number.parseInt(rowIdMatch[1], 10);

    const assignmentLink = row.querySelector<HTMLAnchorElement>("a[href*='/assignments/']");
    if (assignmentLink) {
        const href = assignmentLink.getAttribute("href") || "";
        const linkMatch = href.match(/\/assignments\/(\d+)/);
        if (linkMatch) return Number.parseInt(linkMatch[1], 10);
    }

    return null;
}

function buildFeedbackUrl(assignmentId: number): string {
    return `${getBaseUrl()}/courses/${getCourseId()}/assignments/${assignmentId}/submissions/self`;
}

function injectFeedbackLink(row: HTMLElement, assignmentId: number): void {
    if (row.querySelector(`.${LINK_CLASS}`)) return;

    const link = document.createElement("a");
    link.className = LINK_CLASS;
    link.href = buildFeedbackUrl(assignmentId);
    link.textContent = "View Feedback";
    link.title = "Open submission details and feedback";

    const host = row.querySelector<HTMLElement>(".ig-admin, .assignment-actions, .ig-row, .ig-row__layout, .ig-info") || row;
    host.appendChild(link);
}

function applyGlow(feedbackAssignments: Set<number>): void {
    getAssignmentRows().forEach(row => {
        const assignmentId = getAssignmentId(row);
        if (assignmentId === null || !feedbackAssignments.has(assignmentId)) return;
        row.classList.add(ROW_GLOW_CLASS);
        injectFeedbackLink(row, assignmentId);
    });
}

function setupObserver(feedbackAssignments: Set<number>): void {
    if (observerReady) return;
    observerReady = true;

    const root = document.querySelector("#content") || document.body;
    const observer = new MutationObserver(() => applyGlow(feedbackAssignments));
    observer.observe(root, { childList: true, subtree: true });
}

export async function injectEnhancedFeedbackGlow(): Promise<void> {
    const feedbackAssignments = await loadFeedbackAssignments();
    applyGlow(feedbackAssignments);
    setupObserver(feedbackAssignments);
}
