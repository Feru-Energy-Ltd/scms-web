"use client";

import {
  CHARGE_BOX_CONNECTOR_TYPES,
  type ConnectorSlotDraft,
} from "@/lib/api/chargeBoxes";
import listStyles from "@/components/account/ResourceList.module.css";
import formStyles from "../../new/create-charge-box.module.css";

type ConnectorsSectionProps = {
  canEdit: boolean;
  slots: ConnectorSlotDraft[];
  onChange: (slots: ConnectorSlotDraft[]) => void;
  onAdd: () => void;
};

export default function ConnectorsSection({
  canEdit,
  slots,
  onChange,
  onAdd,
}: ConnectorsSectionProps) {
  function patchSlot(index: number, patch: Partial<ConnectorSlotDraft>) {
    onChange(
      slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)),
    );
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  if (!canEdit) {
    if (slots.length === 0) {
      return <p className={listStyles.muted}>No connectors configured.</p>;
    }

    return (
      <div className={listStyles.tableWrap}>
        <table className={listStyles.table}>
          <thead>
            <tr>
              <th className={listStyles.th}>Connector</th>
              <th className={listStyles.th}>Current</th>
              <th className={listStyles.th}>Plug type</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.key}>
                <td className={listStyles.td}>#{slot.connectorId}</td>
                <td className={listStyles.td}>{slot.currentType}</td>
                <td className={listStyles.td}>
                  {slot.connectorType.replace(/_/g, " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <p className={listStyles.muted}>
        Each connector maps to an OCPP connector id on the physical charger.
        Removing a connector deletes it from this charge box.
      </p>

      {slots.length === 0 ? (
        <p className={listStyles.muted}>No connectors yet. Add one below.</p>
      ) : (
        <div className={formStyles.connectorList}>
          {slots.map((slot, index) => (
            <div key={slot.key} className={formStyles.connectorCardEditable}>
              <span className={formStyles.connectorIndex}>#{slot.connectorId}</span>
              <select
                className={listStyles.textInput}
                aria-label={`Connector ${slot.connectorId} current`}
                value={slot.currentType}
                onChange={(e) =>
                  patchSlot(index, {
                    currentType: e.target.value as ConnectorSlotDraft["currentType"],
                  })
                }
              >
                <option value="AC">AC</option>
                <option value="DC">DC</option>
              </select>
              <select
                className={listStyles.textInput}
                aria-label={`Connector ${slot.connectorId} plug type`}
                value={slot.connectorType}
                onChange={(e) =>
                  patchSlot(index, {
                    connectorType: e.target
                      .value as ConnectorSlotDraft["connectorType"],
                  })
                }
              >
                {CHARGE_BOX_CONNECTOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={formStyles.removeButton}
                onClick={() => removeSlot(index)}
                disabled={slots.length <= 1}
                aria-label={`Remove connector ${slot.connectorId}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={formStyles.connectorToolbar}>
        <button type="button" className={listStyles.button} onClick={onAdd}>
          Add connector
        </button>
      </div>
    </>
  );
}
