import { LanguageSwitcher } from "../language/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/language-context";
import type { TranslationKey } from "../../lib/i18n/types";

type TextKeyItem = {
  key: string;
  titleKey?: TranslationKey;
  bodyKey: TranslationKey;
  metaKey?: TranslationKey;
};

type MappingItem = {
  labelKey: TranslationKey;
  value: string;
};

const workflowSteps: TextKeyItem[] = [
  {
    key: "intake",
    titleKey: "tutorial.workflow.intake.title",
    bodyKey: "tutorial.workflow.intake.body",
  },
  {
    key: "generate",
    titleKey: "tutorial.workflow.generate.title",
    bodyKey: "tutorial.workflow.generate.body",
  },
  {
    key: "review",
    titleKey: "tutorial.workflow.review.title",
    bodyKey: "tutorial.workflow.review.body",
  },
  {
    key: "milestone",
    titleKey: "tutorial.workflow.milestone.title",
    bodyKey: "tutorial.workflow.milestone.body",
  },
  {
    key: "handoff",
    titleKey: "tutorial.workflow.handoff.title",
    bodyKey: "tutorial.workflow.handoff.body",
  },
  {
    key: "sync",
    titleKey: "tutorial.workflow.sync.title",
    bodyKey: "tutorial.workflow.sync.body",
  },
];

const quickStartSteps: TextKeyItem[] = [
  {
    key: "quick-1",
    metaKey: "tutorial.quickStart.step1.time",
    bodyKey: "tutorial.quickStart.step1.body",
  },
  {
    key: "quick-2",
    metaKey: "tutorial.quickStart.step2.time",
    bodyKey: "tutorial.quickStart.step2.body",
  },
  {
    key: "quick-3",
    metaKey: "tutorial.quickStart.step3.time",
    bodyKey: "tutorial.quickStart.step3.body",
  },
  {
    key: "quick-4",
    metaKey: "tutorial.quickStart.step4.time",
    bodyKey: "tutorial.quickStart.step4.body",
  },
  {
    key: "quick-5",
    metaKey: "tutorial.quickStart.step5.time",
    bodyKey: "tutorial.quickStart.step5.body",
  },
  {
    key: "quick-6",
    metaKey: "tutorial.quickStart.step6.time",
    bodyKey: "tutorial.quickStart.step6.body",
  },
];

const boundaryItems: TextKeyItem[] = [
  {
    key: "api",
    titleKey: "tutorial.boundary.apiKey.title",
    bodyKey: "tutorial.boundary.apiKey.body",
  },
  {
    key: "draft",
    titleKey: "tutorial.boundary.aiChat.title",
    bodyKey: "tutorial.boundary.aiChat.body",
  },
  {
    key: "privacy",
    titleKey: "tutorial.boundary.fullContext.title",
    bodyKey: "tutorial.boundary.fullContext.body",
  },
  {
    key: "workspace",
    titleKey: "tutorial.boundary.workspace.title",
    bodyKey: "tutorial.boundary.workspace.body",
  },
  {
    key: "context",
    titleKey: "tutorial.boundary.context.title",
    bodyKey: "tutorial.boundary.context.body",
  },
  {
    key: "verify",
    titleKey: "tutorial.boundary.codexVerify.title",
    bodyKey: "tutorial.boundary.codexVerify.body",
  },
];

const lostItems: TextKeyItem[] = [
  {
    key: "lost-1",
    bodyKey: "tutorial.lost.item1",
  },
  {
    key: "lost-2",
    bodyKey: "tutorial.lost.item2",
  },
  {
    key: "lost-3",
    bodyKey: "tutorial.lost.item3",
  },
  {
    key: "lost-4",
    bodyKey: "tutorial.lost.item4",
  },
  {
    key: "lost-5",
    bodyKey: "tutorial.lost.item5",
  },
];

const mistakeItems: TextKeyItem[] = [
  {
    key: "mistake-1",
    bodyKey: "tutorial.mistakes.item1",
  },
  {
    key: "mistake-2",
    bodyKey: "tutorial.mistakes.item2",
  },
  {
    key: "mistake-3",
    bodyKey: "tutorial.mistakes.item3",
  },
  {
    key: "mistake-4",
    bodyKey: "tutorial.mistakes.item4",
  },
  {
    key: "mistake-5",
    bodyKey: "tutorial.mistakes.item5",
  },
  {
    key: "mistake-6",
    bodyKey: "tutorial.mistakes.item6",
  },
];

const nodeMappings: MappingItem[] = [
  { labelKey: "graph.nodeType.intent", value: "intent" },
  { labelKey: "graph.nodeType.user", value: "user" },
  { labelKey: "graph.nodeType.screen", value: "screen" },
  { labelKey: "graph.nodeType.feature", value: "feature" },
  { labelKey: "graph.nodeType.flowStep", value: "flow_step" },
  { labelKey: "graph.nodeType.dataObject", value: "data_object" },
  { labelKey: "graph.nodeType.aiTask", value: "ai_task" },
  { labelKey: "graph.nodeType.question", value: "question" },
];

const relationshipMappings: MappingItem[] = [
  { labelKey: "graph.relationshipType.serves", value: "serves" },
  { labelKey: "graph.relationshipType.uses", value: "uses" },
  { labelKey: "graph.relationshipType.leadsTo", value: "leads_to" },
  { labelKey: "graph.relationshipType.contains", value: "contains" },
  { labelKey: "graph.relationshipType.dependsOn", value: "depends_on" },
  { labelKey: "graph.relationshipType.produces", value: "produces" },
  { labelKey: "graph.relationshipType.needsConfirmation", value: "needs_confirmation" },
  { labelKey: "graph.relationshipType.relatesTo", value: "relates_to" },
];

const reviewMappings: MappingItem[] = [
  { labelKey: "review.status.suggested", value: "suggested" },
  { labelKey: "review.status.confirmed", value: "confirmed" },
  { labelKey: "review.status.needsReview", value: "needs_review" },
  { labelKey: "review.status.rejected", value: "rejected" },
];

const lifecycleMappings: MappingItem[] = [
  { labelKey: "lifecycle.status.draft", value: "draft" },
  { labelKey: "lifecycle.status.planned", value: "planned" },
  { labelKey: "lifecycle.status.ready", value: "ready" },
  { labelKey: "lifecycle.status.developing", value: "developing" },
  { labelKey: "lifecycle.status.completed", value: "completed" },
  { labelKey: "lifecycle.status.blocked", value: "blocked" },
  { labelKey: "lifecycle.status.needsRefactor", value: "needs_refactor" },
  { labelKey: "lifecycle.status.deprecated", value: "deprecated" },
];

export function TutorialPage() {
  const { t } = useLanguage();

  return (
    <main className="tutorial-page">
      <header className="tutorial-page-header">
        <div>
          <p className="eyebrow">{t("tutorial.eyebrow")}</p>
          <h1>{t("tutorial.title")}</h1>
          <p>{t("tutorial.intro")}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="tutorial-page-actions" aria-label={t("tutorial.eyebrow")}>
        <a className="button button-primary" href="/?tour=1">
          {t("tutorial.openTour")}
        </a>
        <a className="button button-secondary" href="/">
          {t("tutorial.openApp")}
        </a>
      </section>

      <section aria-labelledby="tutorial-workflow-title">
        <h2 id="tutorial-workflow-title">{t("tutorial.workflow.title")}</h2>
        <p>{t("tutorial.workflow.intro")}</p>
        <div className="tutorial-primer-grid">
          {workflowSteps.map((step, index) => (
            <article key={step.key}>
              <span>{index + 1}</span>
              <h2>{step.titleKey ? t(step.titleKey) : null}</h2>
              <p>{t(step.bodyKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="tutorial-quick-start-title">
        <h2 id="tutorial-quick-start-title">{t("tutorial.quickStart.title")}</h2>
        <ol>
          {quickStartSteps.map((step) => (
            <li key={step.key}>
              <strong>{step.metaKey ? t(step.metaKey) : null}</strong> {t(step.bodyKey)}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="tutorial-boundaries-title">
        <h2 id="tutorial-boundaries-title">{t("tutorial.boundaries.title")}</h2>
        <div className="tutorial-primer-grid">
          {boundaryItems.map((item, index) => (
            <article key={item.key}>
              <span>{index + 1}</span>
              <h2>{item.titleKey ? t(item.titleKey) : null}</h2>
              <p>{t(item.bodyKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="tutorial-lost-title">
        <h2 id="tutorial-lost-title">{t("tutorial.lost.title")}</h2>
        <ul>
          {lostItems.map((item) => (
            <li key={item.key}>{t(item.bodyKey)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tutorial-mistakes-title">
        <h2 id="tutorial-mistakes-title">{t("tutorial.mistakes.title")}</h2>
        <ul>
          {mistakeItems.map((item) => (
            <li key={item.key}>{t(item.bodyKey)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tutorial-mapping-title">
        <h2 id="tutorial-mapping-title">{t("tutorial.mapping.title")}</h2>
        <p>{t("tutorial.mapping.intro")}</p>
        <div className="tutorial-primer-grid">
          <MappingCard
            title={t("tutorial.mapping.nodeTypes")}
            items={nodeMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
          <MappingCard
            title={t("tutorial.mapping.relationshipTypes")}
            items={relationshipMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
          <MappingCard
            title={t("tutorial.mapping.reviewStatus")}
            items={reviewMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
          <MappingCard
            title={t("tutorial.mapping.lifecycleStatus")}
            items={lifecycleMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
        </div>
      </section>
    </main>
  );
}

function MappingCard({
  title,
  items,
  labelHeader,
  valueHeader,
  translate,
}: {
  title: string;
  items: MappingItem[];
  labelHeader: string;
  valueHeader: string;
  translate: (key: TranslationKey) => string;
}) {
  return (
    <article>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>{labelHeader}</th>
            <th>{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.value}>
              <td>{translate(item.labelKey)}</td>
              <td>
                <code>{item.value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
