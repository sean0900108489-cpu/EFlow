import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";
import { useLanguage } from "../../lib/i18n/language-context";

type UserType = EngineeringFlowInput["userTypes"][number];

type UserTypesEditorProps = {
  users: UserType[];
  onChange: (users: UserType[]) => void;
};

export function UserTypesEditor({ users, onChange }: UserTypesEditorProps) {
  const { t } = useLanguage();

  function updateUser(id: string, patch: Partial<UserType>) {
    onChange(users.map((user) => (user.id === id ? { ...user, ...patch } : user)));
  }

  function addUser() {
    onChange([
      ...users,
      {
        id: makeId("user"),
        name: "New user type",
        goal: "",
        description: "",
      },
    ]);
  }

  function deleteUser(id: string) {
    onChange(users.filter((user) => user.id !== id));
  }

  return (
    <section className="editor-section">
      <SectionHeader title={t("input.userTypes.title")} count={users.length} onAdd={addUser} />
      {users.map((user) => (
        <article className="editable-card" key={user.id}>
          <CardHeader id={user.id} onDelete={() => deleteUser(user.id)} />
          <label className="field">
            <span>{t("input.common.name")}</span>
            <input value={user.name} onChange={(event) => updateUser(user.id, { name: event.target.value })} />
          </label>
          <label className="field">
            <span>{t("input.userTypes.goal")}</span>
            <input value={user.goal} onChange={(event) => updateUser(user.id, { goal: event.target.value })} />
          </label>
          <label className="field">
            <span>{t("input.common.description")}</span>
            <textarea
              rows={3}
              value={user.description}
              onChange={(event) => updateUser(user.id, { description: event.target.value })}
            />
          </label>
        </article>
      ))}
    </section>
  );
}

function SectionHeader({
  title,
  count,
  onAdd,
}: {
  title: string;
  count: number;
  onAdd: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        <p>{t("input.common.items", { count })}</p>
      </div>
      <button className="mini-button" type="button" onClick={onAdd}>
        {t("input.common.add")}
      </button>
    </div>
  );
}

function CardHeader({ id, onDelete }: { id: string; onDelete: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="card-header">
      <span>{id}</span>
      <button className="danger-button" type="button" onClick={onDelete}>
        {t("input.common.delete")}
      </button>
    </div>
  );
}
