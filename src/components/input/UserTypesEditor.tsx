import type { EngineeringFlowInput } from "../../types/engineeringFlow";
import { makeId } from "../../lib/ids";

type UserType = EngineeringFlowInput["userTypes"][number];

type UserTypesEditorProps = {
  users: UserType[];
  onChange: (users: UserType[]) => void;
};

export function UserTypesEditor({ users, onChange }: UserTypesEditorProps) {
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
      <SectionHeader title="User types" count={users.length} onAdd={addUser} />
      {users.map((user) => (
        <article className="editable-card" key={user.id}>
          <CardHeader id={user.id} onDelete={() => deleteUser(user.id)} />
          <label className="field">
            <span>Name</span>
            <input value={user.name} onChange={(event) => updateUser(user.id, { name: event.target.value })} />
          </label>
          <label className="field">
            <span>Goal</span>
            <input value={user.goal} onChange={(event) => updateUser(user.id, { goal: event.target.value })} />
          </label>
          <label className="field">
            <span>Description</span>
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
  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        <p>{count} items</p>
      </div>
      <button className="mini-button" type="button" onClick={onAdd}>
        Add
      </button>
    </div>
  );
}

function CardHeader({ id, onDelete }: { id: string; onDelete: () => void }) {
  return (
    <div className="card-header">
      <span>{id}</span>
      <button className="danger-button" type="button" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
