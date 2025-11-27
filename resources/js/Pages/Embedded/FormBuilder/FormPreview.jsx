// FormDesigner.jsx (production-ready, does not reset on navigation)

import React, { useEffect, useState } from "react";

import {
    Modal,
    TextField,
    Button,
    Card,
    Text,
    Badge,
    Tooltip,
    Checkbox as PolarisCheckbox,
    BlockStack,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, CircleDownIcon, CircleUpIcon } from "@shopify/polaris-icons";

const FIELD_LIBRARY = [
    {
        category: "Text Elements",
        items: [
            { type: "Single Line", icon: "" },
            { type: "Multi Line", icon: "" },
        ],
    },
    {
        category: "Date Elements",
        items: [
            { type: "Date", icon: "" },
            { type: "DateTime", icon: "" },
        ],
    },
    {
        category: "Multi Elements",
        items: [
            { type: "Checkbox", icon: "" },
            { type: "Dropdown", icon: "" },
            { type: "Country Dropdown", icon: "" },
            { type: "Yes or No", icon: "" },
            { type: "Phone Field", icon: "" },
        ],
    },
    {
        category: "Media Elements",
        items: [{ type: "Attachment", icon: "" }],
    },
];

// mandatory system fields - keep these ids stable
const MANDATORY_FIELDS = [
    {
        id: "mandatory_name",
        type: "Single Line",
        label: "Name",
        placeholder: "Enter name",
        required: true,
        locked: true,
    },
    {
        id: "mandatory_email",
        type: "Single Line",
        label: "Email",
        placeholder: "Enter email",
        required: true,
        locked: true,
    },
    {
        id: "mandatory_shipping_address",
        type: "Multi Line",
        label: "Shipping Address",
        placeholder: "Enter Shipping Address",
        required: true,
        locked: true,
    },
    {
        id: "mandatory_quantity",
        type: "Single Line",
        label: "Quantity",
        placeholder: "Enter quantity",
        required: true,
        locked: true,
    },
];

function uniqueId(prefix = "f") {
    return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`;
}

export default function FormDesigner({ fields, setFields }) {
    // Local modal / editing state
    const [showModal, setShowModal] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [pendingType, setPendingType] = useState("");
    const [label, setLabel] = useState("");
    const [placeholder, setPlaceholder] = useState("");
    const [options, setOptions] = useState([]);
    const [required, setRequired] = useState(false);
    const [previewFiles, setPreviewFiles] = useState({});

    // Initialize mandatory fields only if fields is empty
    useEffect(() => {
        if (!Array.isArray(fields) || fields.length === 0) {
            // do not overwrite if parent already passed fields
            setFields([...MANDATORY_FIELDS]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    // Open add modal
    const openAddModal = (type) => {
        setEditingFieldId(null);
        setPendingType(type);
        setLabel(type);
        setPlaceholder(["Date", "DateTime", "Attachment", "Country Dropdown"].includes(type) ? "" : `Enter ${String(type).toLowerCase()}`);
        let defaultOptions = [];
        if (type === "Dropdown") defaultOptions = ["Option 1", "Option 2"];
        if (type === "Yes or No") defaultOptions = ["Yes", "No"];
        setOptions(defaultOptions);
        setRequired(false);
        setShowModal(true);
    };

    const openEditModal = (field) => {
        if (field.locked) return;
        setEditingFieldId(field.id);
        setPendingType(field.type);
        setLabel(field.label || field.type);
        setPlaceholder(field.placeholder || "");
        setOptions(field.options ? [...field.options] : []);
        setRequired(!!field.required);
        setShowModal(true);
    };

    const addOrUpdateField = () => {
        if (!pendingType) return;
        if (!label.trim()) {
            alert("Please enter a label for the field.");
            return;
        }

        const normalized = {
            id: editingFieldId || uniqueId(),
            type: pendingType,
            label: label.trim(),
            placeholder: placeholder,
            options: ["Dropdown", "Yes or No"].includes(pendingType) ? options.filter(Boolean) : undefined,
            required: !!required,
        };

        if (editingFieldId) {
            setFields((prev) => prev.map((f) => (f.id === editingFieldId ? { ...f, ...normalized } : f)));
        } else {
            setFields((prev) => [...prev, normalized]);
        }

        setShowModal(false);
        setEditingFieldId(null);
        setPendingType("");
    };

    // Delete a field
    const deleteField = (id) => {
        const target = (fields || []).find((f) => f.id === id);
        if (!target) return;
        if (target.locked) return;
        if (!confirm("Are you sure you want to delete this field?")) return;
        setFields((prev) => prev.filter((f) => f.id !== id));
        setPreviewFiles((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    };

    // Move field up or down
    const moveField = (index, dir) => {
        if (!Array.isArray(fields)) return;
        const item = fields[index];
        if (!item || item.locked) return;
        if (dir === "up" && (index === 0 || fields[index - 1]?.locked)) return;
        if (dir === "down" && (index === fields.length - 1 || fields[index + 1]?.locked)) return;

        const arr = [...fields];
        const [removed] = arr.splice(index, 1);
        arr.splice(dir === "up" ? index - 1 : index + 1, 0, removed);
        setFields(arr);
    };

    const toggleRequired = (id) => {
        const field = (fields || []).find((f) => f.id === id);
        if (!field || field.locked) return;
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, required: !f.required } : f)));
    };

    const addOption = () => setOptions((o) => [...o, `Option ${o.length + 1}`]);
    const updateOption = (i, value) => setOptions((o) => o.map((x, idx) => (idx === i ? value : x)));
    const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));

    const handleFileChange = (fieldId, file) => {
        setPreviewFiles((prev) => ({ ...prev, [fieldId]: file }));
    };

    const renderPreview = (field) => {
        const baseStyle = {
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #e6e8eb",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            pointerEvents: "none",
        };

        switch (field.type) {
            case "Single Line":
                return <input type="text" disabled placeholder={field.placeholder || "Text input"} style={baseStyle} />;
            case "Multi Line":
                return <textarea disabled rows={3} placeholder={field.placeholder || "Multi-line text input"} style={{ ...baseStyle, resize: "vertical" }} />;
            case "Date":
                return <input type="date" disabled style={baseStyle} />;
            case "DateTime":
                return <input type="datetime-local" disabled style={baseStyle} />;
            case "Checkbox":
                return (
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="checkbox" disabled /> <span style={{ fontSize: "14px" }}>{field.label}</span>
                    </label>
                );
            case "Yes or No":
                return (
                    <div style={{ display: "flex", gap: 16 }}>
                        <label><input type="radio" disabled name={`yn_${field.id}`} /> <span style={{ fontSize: "14px" }}>Yes</span></label>
                        <label><input type="radio" disabled name={`yn_${field.id}`} /> <span style={{ fontSize: "14px" }}>No</span></label>
                    </div>
                );
            case "Dropdown":
                return (
                    <select disabled style={baseStyle}>
                        <option value="">Select {field.label || "Option"}</option>
                        {(field.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}
                    </select>
                );
            case "Country Dropdown":
                return (
                    <select disabled style={baseStyle}>
                        <option value="">Select Country</option>
                    </select>
                );
            case "Phone Field":
                return <input type="tel" disabled placeholder={field.placeholder || "Phone number (e.g., 555-555-5555)"} style={baseStyle} />;
            case "Attachment": {
                const file = previewFiles[field.id];
                return (
                    <div style={{ padding: "8px", border: "1px dashed #e6e8eb", borderRadius: 6, background: "#f9f9f9", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Text variant="bodyMd" as="p" color="subdued" style={{ margin: 0 }}>
                            Drag and drop file here, or click to browse.
                        </Text>
                        {file && <Text variant="bodySm" as="p" style={{ marginTop: 4 }}>File attached: {file.name}</Text>}
                    </div>
                );
            }
            default:
                return <input type="text" disabled placeholder={field.placeholder || "Unknown field type"} style={baseStyle} />;
        }
    };

    return (
        <div style={{ display: "flex", gap: 20, width: "100%", alignItems: "flex-start", fontFamily: "Inter, Arial, sans-serif" }}>
            <div style={{ width: 360, border: "1px solid #e6e8eb", borderRadius: 8, padding: 16, background: "#fbfbfb", position: "sticky", top: "20px" }}>
                <Text as="h3" variant="headingLg" style={{ marginBottom: 12 }}>Available Fields</Text>
                <div style={{ marginTop: 16 }}>
                    {FIELD_LIBRARY.map((cat) => (
                        <div key={cat.category} style={{ marginBottom: 18 }}>
                            <Text as="h4" variant="headingMd" style={{ marginBottom: 8 }}>{cat.category}</Text>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {cat.items.map((it) => (
                                    <div
                                        role="button"
                                        key={it.type}
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === "Enter") openAddModal(it.type); }}
                                        onClick={() => openAddModal(it.type)}
                                        style={{
                                            minWidth: 150,
                                            borderRadius: 8,
                                            padding: "10px 12px",
                                            border: "1px solid #5c6ac4",
                                            background: "#e6eaf8",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ fontSize: 14 }}>{it.icon}</div>
                                            <div style={{ fontSize: 14 }}>{it.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, border: "1px solid #e6e8eb", borderRadius: 8, padding: 16, background: "#fff" }}>
                <div style={{ marginBottom: 12 }}>
                    <Text as="h3" variant="headingMd">Form Preview & Designer</Text>
                    <Text as="p" variant="bodySm" color="subdued">Rearrange and configure the fields below.</Text>
                </div>

                <BlockStack gap="400">
                    {(!fields || fields.length === 0) && (
                        <Card sectioned>
                            <div style={{ color: "#6b6b6b" }}>
                                No fields yet. Use the left panel to add fields to your form.
                            </div>
                        </Card>
                    )}

                    {(fields || []).map((f, idx) => (
                        <Card key={f.id} sectioned>
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <Text variant="bodyLg" as="p" fontWeight="semibold">
                                                {f.label}
                                                {f.required && <span style={{ color: "#d72c0d", marginLeft: 6 }}>*</span>}
                                            </Text>
                                            <Badge status={f.locked ? "attention" : "success"}>{f.locked ? "System Locked" : f.type}</Badge>
                                        </div>

                                        <div style={{ display: "flex", gap: 6 }}>
                                            <Tooltip content="Move up">
                                                <Button plain monochrome icon={CircleUpIcon} onClick={() => moveField(idx, "up")} disabled={f.locked || idx === 0 || fields[idx - 1]?.locked} />
                                            </Tooltip>

                                            <Tooltip content="Move down">
                                                <Button plain monochrome icon={CircleDownIcon} onClick={() => moveField(idx, "down")} disabled={f.locked || idx === fields.length - 1 || fields[idx + 1]?.locked} />
                                            </Tooltip>

                                            <Tooltip content="Edit">
                                                <Button plain monochrome icon={EditIcon} onClick={() => openEditModal(f)} disabled={f.locked} />
                                            </Tooltip>

                                            <Tooltip content="Delete">
                                                <Button plain destructive icon={DeleteIcon} onClick={() => deleteField(f.id)} disabled={f.locked} />
                                            </Tooltip>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 8 }}>{renderPreview(f)}</div>

                                    {f.type === "Attachment" && (
                                        <div style={{ marginTop: 6 }}>
                                            <input type="file" onChange={(e) => handleFileChange(f.id, e.target.files?.[0])} />
                                            <Text variant="bodySm" as="p" color="subdued">Note: File selected here is for preview only and will not be saved.</Text>
                                        </div>
                                    )}

                                    {(f.type === "Country Dropdown") && (
                                        <Text variant="bodySm" as="p" color="subdued" style={{ marginTop: 8 }}>
                                            The dropdown is pre-populated with Shopify Country and State values.
                                        </Text>
                                    )}
                                </div>

                                <div style={{ width: 120, minWidth: 120, paddingTop: 30 }}>
                                    <PolarisCheckbox label="Required" checked={!!f.required} onChange={() => toggleRequired(f.id)} disabled={f.locked} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </BlockStack>
            </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingFieldId ? "Edit Field" : `Add ${pendingType} Field`}
                primaryAction={{ content: editingFieldId ? "Save Changes" : "Add Field", onAction: addOrUpdateField }}
                secondaryActions={[{ content: "Cancel", onAction: () => setShowModal(false) }]}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <TextField
                            label="Field Label"
                            value={label}
                            onChange={(v) => setLabel(v)}
                            autoComplete="off"
                            disabled={editingFieldId && fields.find((f) => f.id === editingFieldId)?.locked}
                            error={label.trim() === "" ? "Label is required" : false}
                        />

                        {pendingType && !["Date", "DateTime", "Attachment", "Checkbox", "Yes or No", "Country Dropdown"].includes(pendingType) && (
                            <TextField label="Placeholder Text" value={placeholder} onChange={(v) => setPlaceholder(v)} autoComplete="off" />
                        )}

                        {["Dropdown", "Yes or No"].includes(pendingType) && (
                            <Card title="Options" sectioned>
                                <BlockStack gap="200">
                                    {options.map((opt, i) => (
                                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <TextField value={opt} onChange={(v) => updateOption(i, v)} placeholder={`Option ${i + 1}`} autoComplete="off" />
                                            <Button plain destructive onClick={() => removeOption(i)} disabled={options.length <= 1}>Remove</Button>
                                        </div>
                                    ))}
                                    <Button plain onClick={addOption}>+ Add option</Button>
                                </BlockStack>
                            </Card>
                        )}

                        {(pendingType === "Country Dropdown") && (
                            <Text variant="bodyMd" as="p" color="subdued">
                                This is a pre-defined system field. Its options cannot be edited here.
                            </Text>
                        )}

                        <PolarisCheckbox
                            label="Field is Required"
                            checked={required}
                            onChange={(v) => setRequired(v)}
                            disabled={editingFieldId && fields.find((f) => f.id === editingFieldId)?.locked}
                        />
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </div>
    );
}
