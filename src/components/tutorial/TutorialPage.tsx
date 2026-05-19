import { LanguageSwitcher } from "../language/LanguageSwitcher";
import { useLanguage } from "../../lib/i18n/language-context";
import type { TranslationKey } from "../../lib/i18n/types";

type MappingItem = {
  labelKey: TranslationKey;
  value: string;
};

type PlaybookStep = {
  key: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  whatKey: TranslationKey;
  whereKey: TranslationKey;
  doneKey: TranslationKey;
  dontKey: TranslationKey;
  checklistKeys: TranslationKey[];
  demo: "intake" | "generate" | "review" | "milestone" | "handoff" | "sync";
};

const lostItems: TranslationKey[] = [
  "tutorial.lost.item1",
  "tutorial.lost.item2",
  "tutorial.lost.item3",
  "tutorial.lost.item4",
  "tutorial.lost.item5",
];

const playbookSteps: PlaybookStep[] = [
  {
    key: "intake",
    titleKey: "tutorial.workflow.intake.title",
    bodyKey: "tutorial.workflow.intake.body",
    whatKey: "tutorial.workflow.intake.what",
    whereKey: "tutorial.workflow.intake.where",
    doneKey: "tutorial.workflow.intake.done",
    dontKey: "tutorial.workflow.intake.dont",
    checklistKeys: [
      "tutorial.workflow.intake.check1",
      "tutorial.workflow.intake.check2",
      "tutorial.workflow.intake.check3",
    ],
    demo: "intake",
  },
  {
    key: "generate",
    titleKey: "tutorial.workflow.generate.title",
    bodyKey: "tutorial.workflow.generate.body",
    whatKey: "tutorial.workflow.generate.what",
    whereKey: "tutorial.workflow.generate.where",
    doneKey: "tutorial.workflow.generate.done",
    dontKey: "tutorial.workflow.generate.dont",
    checklistKeys: [
      "tutorial.workflow.generate.check1",
      "tutorial.workflow.generate.check2",
      "tutorial.workflow.generate.check3",
    ],
    demo: "generate",
  },
  {
    key: "review",
    titleKey: "tutorial.workflow.review.title",
    bodyKey: "tutorial.workflow.review.body",
    whatKey: "tutorial.workflow.review.what",
    whereKey: "tutorial.workflow.review.where",
    doneKey: "tutorial.workflow.review.done",
    dontKey: "tutorial.workflow.review.dont",
    checklistKeys: [
      "tutorial.workflow.review.check1",
      "tutorial.workflow.review.check2",
      "tutorial.workflow.review.check3",
    ],
    demo: "review",
  },
  {
    key: "milestone",
    titleKey: "tutorial.workflow.milestone.title",
    bodyKey: "tutorial.workflow.milestone.body",
    whatKey: "tutorial.workflow.milestone.what",
    whereKey: "tutorial.workflow.milestone.where",
    doneKey: "tutorial.workflow.milestone.done",
    dontKey: "tutorial.workflow.milestone.dont",
    checklistKeys: [
      "tutorial.workflow.milestone.check1",
      "tutorial.workflow.milestone.check2",
      "tutorial.workflow.milestone.check3",
    ],
    demo: "milestone",
  },
  {
    key: "handoff",
    titleKey: "tutorial.workflow.handoff.title",
    bodyKey: "tutorial.workflow.handoff.body",
    whatKey: "tutorial.workflow.handoff.what",
    whereKey: "tutorial.workflow.handoff.where",
    doneKey: "tutorial.workflow.handoff.done",
    dontKey: "tutorial.workflow.handoff.dont",
    checklistKeys: [
      "tutorial.workflow.handoff.check1",
      "tutorial.workflow.handoff.check2",
      "tutorial.workflow.handoff.check3",
    ],
    demo: "handoff",
  },
  {
    key: "sync",
    titleKey: "tutorial.workflow.sync.title",
    bodyKey: "tutorial.workflow.sync.body",
    whatKey: "tutorial.workflow.sync.what",
    whereKey: "tutorial.workflow.sync.where",
    doneKey: "tutorial.workflow.sync.done",
    dontKey: "tutorial.workflow.sync.dont",
    checklistKeys: [
      "tutorial.workflow.sync.check1",
      "tutorial.workflow.sync.check2",
      "tutorial.workflow.sync.check3",
    ],
    demo: "sync",
  },
];

const safetyItems: TranslationKey[] = [
  "tutorial.safety.item1",
  "tutorial.safety.item2",
  "tutorial.safety.item3",
  "tutorial.safety.item4",
  "tutorial.safety.item5",
  "tutorial.safety.item6",
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
      <header className="tutorial-hero">
        <div className="tutorial-hero-copy">
          <p className="eyebrow">{t("tutorial.eyebrow")}</p>
          <h1>{t("tutorial.title")}</h1>
          <p>{t("tutorial.intro")}</p>
          <div className="tutorial-page-actions" aria-label={t("tutorial.actions.ariaLabel")}>
            <a className="button button-primary" href="/">
              {t("tutorial.openApp")}
            </a>
            <a className="button button-secondary" href="/?tour=1">
              {t("tutorial.openTour")}
            </a>
          </div>
        </div>
        <div className="tutorial-hero-panel" aria-label={t("tutorial.heroFlow.ariaLabel")}>
          {[
            "tutorial.heroFlow.intake",
            "tutorial.heroFlow.generate",
            "tutorial.heroFlow.review",
            "tutorial.heroFlow.milestone",
            "tutorial.heroFlow.handoff",
            "tutorial.heroFlow.sync",
          ].map((key, index) => (
            <div className="hero-flow-step" key={key}>
              <span>{index + 1}</span>
              <p>{t(key as TranslationKey)}</p>
            </div>
          ))}
        </div>
        <LanguageSwitcher />
      </header>

      <section className="tutorial-lost-block" aria-labelledby="tutorial-lost-title">
        <div className="tutorial-section-heading compact">
          <p className="eyebrow">{t("tutorial.lost.eyebrow")}</p>
          <h2 id="tutorial-lost-title">{t("tutorial.lost.title")}</h2>
        </div>
        <div className="lost-card-grid">
          {lostItems.map((key) => (
            <article className="lost-card" key={key}>
              <span aria-hidden="true" />
              <p>{t(key)}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="tutorial-workflow-title">
        <div className="tutorial-section-heading">
          <p className="eyebrow">{t("tutorial.workflow.eyebrow")}</p>
          <h2 id="tutorial-workflow-title">{t("tutorial.workflow.title")}</h2>
          <p>{t("tutorial.workflow.intro")}</p>
        </div>
        <div className="playbook-steps">
          {playbookSteps.map((step, index) => (
            <PlaybookStepCard key={step.key} step={step} stepNumber={index + 1} translate={t} />
          ))}
        </div>
      </section>

      <section className="tutorial-safety" aria-labelledby="tutorial-safety-title">
        <div className="tutorial-safety-heading">
          <span aria-hidden="true">!</span>
          <div>
            <p className="eyebrow">{t("tutorial.safety.eyebrow")}</p>
            <h2 id="tutorial-safety-title">{t("tutorial.safety.title")}</h2>
            <p>{t("tutorial.safety.body")}</p>
          </div>
        </div>
        <ul className="safety-list">
          {safetyItems.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tutorial-mapping-title">
        <div className="tutorial-section-heading">
          <p className="eyebrow">{t("tutorial.mapping.eyebrow")}</p>
          <h2 id="tutorial-mapping-title">{t("tutorial.mapping.title")}</h2>
          <p>{t("tutorial.mapping.intro")}</p>
        </div>
        <div className="tutorial-mapping-grid">
          <MappingCard
            title={t("tutorial.mapping.nodeTypes")}
            description={t("tutorial.mapping.nodeTypesNote")}
            items={nodeMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
          <MappingCard
            title={t("tutorial.mapping.relationshipTypes")}
            description={t("tutorial.mapping.relationshipTypesNote")}
            items={relationshipMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
          <MappingCard
            title={t("tutorial.mapping.reviewStatus")}
            description={t("tutorial.mapping.reviewStatusNote")}
            items={reviewMappings}
            labelHeader={t("tutorial.mapping.uiLabel")}
            valueHeader={t("tutorial.mapping.schemaEnum")}
            translate={t}
          />
          <MappingCard
            title={t("tutorial.mapping.lifecycleStatus")}
            description={t("tutorial.mapping.lifecycleStatusNote")}
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

function PlaybookStepCard({
  step,
  stepNumber,
  translate,
}: {
  step: PlaybookStep;
  stepNumber: number;
  translate: (key: TranslationKey) => string;
}) {
  return (
    <article className="playbook-step-card">
      <div className="playbook-step-copy">
        <div className="step-kicker">
          <span>{stepNumber}</span>
          <p>{translate("tutorial.workflow.stepLabel")}</p>
        </div>
        <h3>{translate(step.titleKey)}</h3>
        <p className="step-summary">{translate(step.bodyKey)}</p>

        <dl className="step-field-grid">
          <div>
            <dt>{translate("tutorial.workflow.whatLabel")}</dt>
            <dd>{translate(step.whatKey)}</dd>
          </div>
          <div>
            <dt>{translate("tutorial.workflow.whereLabel")}</dt>
            <dd>{translate(step.whereKey)}</dd>
          </div>
          <div>
            <dt>{translate("tutorial.workflow.doneLabel")}</dt>
            <dd>{translate(step.doneKey)}</dd>
          </div>
          <div>
            <dt>{translate("tutorial.workflow.dontLabel")}</dt>
            <dd>{translate(step.dontKey)}</dd>
          </div>
        </dl>

        <div className="action-checklist">
          <p>{translate("tutorial.workflow.checklistLabel")}</p>
          <ul>
            {step.checklistKeys.map((key) => (
              <li key={key}>{translate(key)}</li>
            ))}
          </ul>
        </div>
      </div>
      <StepDemo demo={step.demo} translate={translate} />
    </article>
  );
}

function StepDemo({
  demo,
  translate,
}: {
  demo: PlaybookStep["demo"];
  translate: (key: TranslationKey) => string;
}) {
  switch (demo) {
    case "intake":
      return (
        <div className="mini-demo mini-demo-intake" aria-label={translate("tutorial.demo.intake.ariaLabel")}>
          <div className="raw-idea-card">
            <span>{translate("tutorial.demo.intake.rawIdea")}</span>
            <p>{translate("tutorial.demo.intake.rawBody")}</p>
          </div>
          <span className="demo-arrow" aria-hidden="true">
            →
          </span>
          <div className="mock-input-card">
            <div className="mock-card-title">{translate("tutorial.demo.intake.structuredInput")}</div>
            {[
              ["tutorial.demo.intake.row.intent", "tutorial.demo.intake.value.intent"],
              ["tutorial.demo.intake.row.user", "tutorial.demo.intake.value.user"],
              ["tutorial.demo.intake.row.features", "tutorial.demo.intake.value.features"],
              ["tutorial.demo.intake.row.unknowns", "tutorial.demo.intake.value.unknowns"],
            ].map(([labelKey, valueKey]) => (
              <div className="mock-input-row" key={labelKey}>
                <span>{translate(labelKey as TranslationKey)}</span>
                <strong>{translate(valueKey as TranslationKey)}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    case "generate":
      return (
        <div className="mini-demo mini-demo-generate" aria-label={translate("tutorial.demo.generate.ariaLabel")}>
          <PipelineNode title={translate("tutorial.demo.generate.input")} note={translate("tutorial.demo.generate.inputNote")} />
          <span className="demo-arrow" aria-hidden="true">
            →
          </span>
          <PipelineNode
            title={translate("tutorial.demo.generate.graph")}
            note={translate("tutorial.demo.generate.graphNote")}
            strong
          />
          <span className="demo-arrow" aria-hidden="true">
            →
          </span>
          <PipelineNode title={translate("tutorial.demo.generate.canvas")} note={translate("tutorial.demo.generate.canvasNote")} />
        </div>
      );
    case "review":
      return (
        <div className="mini-demo mini-demo-review" aria-label={translate("tutorial.demo.review.ariaLabel")}>
          <div className="review-check-card">
            <div className="mock-card-title">{translate("tutorial.demo.review.cardTitle")}</div>
            {[
              "tutorial.demo.review.intent",
              "tutorial.demo.review.user",
              "tutorial.demo.review.flow",
              "tutorial.demo.review.blockers",
            ].map((key) => (
              <div className="review-row" key={key}>
                <span aria-hidden="true" />
                <p>{translate(key as TranslationKey)}</p>
              </div>
            ))}
          </div>
          <div className="trust-meter">
            <span>{translate("tutorial.demo.review.reviewStatus")}</span>
            <strong>{translate("tutorial.demo.review.trust")}</strong>
            <em>{translate("tutorial.demo.review.notProgress")}</em>
          </div>
        </div>
      );
    case "milestone":
      return (
        <div className="mini-demo mini-demo-milestone" aria-label={translate("tutorial.demo.milestone.ariaLabel")}>
          <div className="selected-node-stack">
            {[
              "tutorial.demo.milestone.node1",
              "tutorial.demo.milestone.node2",
              "tutorial.demo.milestone.node3",
            ].map((key) => (
              <span className="node-chip" key={key}>
                {translate(key as TranslationKey)}
              </span>
            ))}
          </div>
          <span className="demo-arrow" aria-hidden="true">
            →
          </span>
          <div className="milestone-card">
            <div className="mock-card-title">{translate("tutorial.demo.milestone.cardTitle")}</div>
            <p>{translate("tutorial.demo.milestone.smallScope")}</p>
            <div>
              <span>{translate("tutorial.demo.milestone.allowed")}</span>
              <span>{translate("tutorial.demo.milestone.notAllowed")}</span>
              <span>{translate("tutorial.demo.milestone.validation")}</span>
            </div>
          </div>
        </div>
      );
    case "handoff":
      return (
        <div className="mini-demo mini-demo-handoff" aria-label={translate("tutorial.demo.handoff.ariaLabel")}>
          {[
            ["tutorial.demo.handoff.workspace", "tutorial.demo.handoff.workspaceUse"],
            ["tutorial.demo.handoff.context", "tutorial.demo.handoff.contextUse"],
            ["tutorial.demo.handoff.prompt", "tutorial.demo.handoff.promptUse"],
          ].map(([titleKey, noteKey]) => (
            <div className="export-card" key={titleKey}>
              <strong>{translate(titleKey as TranslationKey)}</strong>
              <span>{translate(noteKey as TranslationKey)}</span>
            </div>
          ))}
        </div>
      );
    case "sync":
      return (
        <div className="mini-demo mini-demo-sync" aria-label={translate("tutorial.demo.sync.ariaLabel")}>
          <div className="return-loop">
            <PipelineNode title={translate("tutorial.demo.sync.report")} note={translate("tutorial.demo.sync.reportNote")} />
            <span className="demo-arrow" aria-hidden="true">
              →
            </span>
            <PipelineNode title={translate("tutorial.demo.sync.verify")} note={translate("tutorial.demo.sync.verifyNote")} strong />
            <span className="demo-arrow" aria-hidden="true">
              →
            </span>
            <PipelineNode title={translate("tutorial.demo.sync.lifecycle")} note={translate("tutorial.demo.sync.lifecycleNote")} />
          </div>
          <p className="sync-truth-note">{translate("tutorial.demo.sync.truthNote")}</p>
        </div>
      );
  }
}

function PipelineNode({ title, note, strong = false }: { title: string; note: string; strong?: boolean }) {
  return (
    <div className={strong ? "pipeline-node is-strong" : "pipeline-node"}>
      <strong>{title}</strong>
      <span>{note}</span>
    </div>
  );
}

function MappingCard({
  title,
  description,
  items,
  labelHeader,
  valueHeader,
  translate,
}: {
  title: string;
  description: string;
  items: MappingItem[];
  labelHeader: string;
  valueHeader: string;
  translate: (key: TranslationKey) => string;
}) {
  return (
    <article className="mapping-card">
      <h3>{title}</h3>
      <p>{description}</p>
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
