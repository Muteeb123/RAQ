import React, { useState, useEffect, useMemo } from "react";
import {
    Page,
    Card,
    Text,
    Button,
    Badge,
    TextField,
    Select,
    InlineStack
} from "@shopify/polaris";

import { usePage } from "@inertiajs/react";
import "../../../css/ProposalPage.css"
export default function ProposalPage() {
    const { props } = usePage();
    const query = props?.ziggy?.query;
    const quote = props.quote || {
        quotation_id: "1vnvaAyDjz",
        status: "pending",
        created_at: "07/11/2025 10:44 AM",
        quantity: 5,
        price: 50,
        form_data: {
            Color: "Red",
            Size: "M"
        }
    };
    const proposal = quote?.proposal || null;

    // Customer info appended to form_data
    const customerInfo = {
        name: quote.customer_name || "Craig Aspdin",
        email: quote.customer_email || "caspdin@gmail.com",
        shippingAddress: quote.shipping_address || "401 E Stone Ave Apt 512 Greenville SC 29601 United States",
        ...quote.form_data
    };

    const [product, setProduct] = useState(null); // will fetch from backend
    const [quantity, setQuantity] = useState(proposal ? proposal.items : quote.quantity);
    const [discountType, setDiscountType] = useState(proposal ? proposal.discount_type : "PERCENTAGE");
    const [discountValue, setDiscountValue] = useState(proposal ? proposal.discount : 10);
    const [shippingTitle, setShippingTitle] = useState(proposal ? proposal.shipping_title : "");
    const [shippingAmount, setShippingAmount] = useState(proposal ? proposal.shipping_amount : 0);
    const [expiryDays, setExpiryDays] = useState(proposal ? proposal.expiry_days : 30);



    useEffect(() => {
        async function fetchProduct() {
            try {
                console.log("Fetching product:", quote.product_id, quote.variant_id);
                const res = await fetch(`/products/${quote.product_id}/${quote.variant_id}`);
                const data = await res.json();
                setProduct({
                    ...data.product,
                    price: quote.price // override with quoted price
                });
                console.log("Fetched product:", data);
            } catch (err) {
                console.error("Failed to fetch product:", err);
            }
        }

        fetchProduct();
    }, [quote.product_id, quote.price]);

    // Subtotal
    const subtotal = useMemo(() => {
        return product ? product.price * quantity : 0;
    }, [product, quantity]);

    // Discount calculation
    const discountAmount = useMemo(() => {
        if (discountType === "PERCENTAGE") {
            return (subtotal * discountValue) / 100;
        } else {
            return Number(discountValue);
        }
    }, [subtotal, discountValue, discountType]);

    // Final total
    const finalTotal = subtotal - discountAmount + Number(shippingAmount);

    const addShipping = () => {
        if (shippingTitle && shippingAmount >= 0) {
            console.log("Shipping added:", shippingTitle, shippingAmount);
        }
    };

    // Prepare all data for backend
    const payload = {
        quotation_id: quote.quotation_id,
        product_id: quote.product_id,
        variant_id: quote.variant_id,
        quantity,
        price: product?.price || quote.price,
        discountType,
        discountValue,
        shippingTitle,
        shippingAmount,
        expiryDays,
        finalTotal,
        customerInfo
    };
    // Function to send payload to backend
    const sendPayloadToBackend = async () => {
        try {
            const response = await fetch(route('sendproposal', query), {   // adjust the URL to your backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            console.log('Backend response:', data);
            alert('Quote sent successfully!');
        } catch (err) {
            console.error('Failed to send payload:', err);
            alert('Failed to send quote. Check console for details.');
        }
    };

    const handleCreateShopifyOrder = () => alert(`Create Shopify order for ${quote.quotation_id}\nPayload: ${JSON.stringify(payload)}`);
    const handleQuoteStatus = async (action, quotation_id) => {
        try {
            const response = await fetch(`/proposal/${action}/${quotation_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },

            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            console.log('Backend response:', data);
            alert(`Quote ${action} successfully!`);
        } catch (err) {
            console.error(`Failed to ${action} quote:`, err);
            alert(`Failed to ${action} quote. Check console for details.`);
        }
    }

    return (
        <Page
            title={
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
                    <span>Quote {quote.quotation_id}</span>
                    <Badge tone="attention">{quote.status}</Badge>
                </div>
            }
            backAction={{ content: 'Back', onAction: () => window.history.back() }}
            primaryAction={quote.proposal ? null : <Button variant="primary" onClick={handleCreateShopifyOrder}>Create Shopify Order</Button>}
            secondaryActions={quote.proposal ? [] : [
                { content: 'Send Proposal', onAction: sendPayloadToBackend },
            ]}
            actionGroups={[
                {
                    title: 'More actions',
                    actions: quote.proposal ? [] : [
                        { content: 'Archive Quote', variant: 'destructive', onAction: () => handleQuoteStatus('archive', quote.quotation_id) },
                        { content: 'Delete Quote', onAction: () => handleQuoteStatus('delete', quote.quotation_id) },
                    ]
                },
            ]}
        >


            <div className="proposal-container">
                <div className="proposal-main">
                    <div className="left-column">
                        {product && (
                            <Card sectioned className="card-style">
                                <Text variant="headingMd">Product Information</Text>
                                <Text variant="bodyMd" tone="subdued">
                                    Review the requested product details, including quantity, price, and variant.
                                </Text>
                                <div style={{ marginTop: '16px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e1e5e9' }}>
                                                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'normal', color: '#6b7280' }}>Product Description</th>
                                                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'normal', color: '#6b7280' }}>Quantity</th>
                                                <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'normal', color: '#6b7280' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        {/* Image */}
                                                        {product.image && (
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                style={{ width: 80, height: 'auto', borderRadius: 6 }}
                                                            />
                                                        )}

                                                        {/* Text block */}
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ fontWeight: '500' }}>{product.name}</div>

                                                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                                {product.variant} {product.sku}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 8px', width: '85px' }}>
                                                    <TextField
                                                        type="number"
                                                        value={quantity}
                                                        min={1}
                                                        onChange={(value) => {
                                                            const val = Number(value);
                                                            if (val >= 1) setQuantity(val);
                                                        }}
                                                        readOnly={!!proposal}
                                                        style={{ width: '100%' }}         // ensures it fits in the td
                                                        inputStyle={{ padding: '4px 6px', fontSize: '14px', textAlign: 'center' }} // small input
                                                    />
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>${product.price}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* Discount Card */}
                        <Card sectioned className="card-style">
                            <Text variant="headingMd">Add Discount</Text>
                            <Text variant="bodyMd" tone="subdued">
                                Apply a discount to the total amount.
                            </Text>
                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <TextField
                                    label=""
                                    type="number"
                                    value={String(discountValue)}
                                    readOnly={!!proposal}
                                    onChange={(value) => {
                                        let val = Number(value);
                                        if (discountType === "PERCENTAGE") {
                                            if (val < 0) val = 0;
                                            if (val > 100) val = 100;
                                        } else {
                                            if (val < 0) val = 0;
                                            if (val > subtotal) val = subtotal;
                                        }
                                        setDiscountValue(val);
                                    }}
                                    suffix={discountType === "PERCENTAGE" ? "%" : "$"}
                                    autoComplete="off"
                                />
                                <Select
                                    label=""
                                    options={[
                                        { label: "%", value: "PERCENTAGE" },
                                        { label: "$", value: "FIXED_AMOUNT" }
                                    ]}
                                    value={discountType}
                                    onChange={setDiscountType}
                                    disabled={!!proposal}
                                />
                            </div>
                        </Card>

                        {/* Shipping Charges */}
                        <Card sectioned className="card-style">
                            <Text variant="headingMd">Set Shipping Charges</Text>
                            <Text variant="bodyMd" tone="subdued">
                                Add shipping cost to the order.
                            </Text>
                            <InlineStack gap={400}>
                                <TextField
                                    label="Shipping Title"
                                    value={shippingTitle}
                                    onChange={setShippingTitle}
                                    autoComplete="off"
                                    readOnly={!!proposal}
                                />
                                <TextField
                                    label="Shipping Amount"
                                    type="number"
                                    value={shippingAmount}
                                    min={0}
                                    onChange={(value) => {
                                        let val = Number(value);
                                        if (val < 0) val = 0;
                                        setShippingAmount(val);
                                    }}
                                    prefix="$"
                                    autoComplete="off"
                                    readOnly={!!proposal}
                                />
                            </InlineStack>
                        </Card>

                        {/* Proposal Expiry */}
                        <Card sectioned className="card-style">
                            <Text variant="headingMd">Proposal Expiry Limit</Text>
                            <Text variant="bodyMd" tone="subdued">
                                Set how many days a proposal remains valid after it's sent.
                            </Text>
                            <div style={{ marginTop: '16px' }}>
                                <TextField
                                    label=""
                                    type="number"
                                    min={1}
                                    value={String(expiryDays)}
                                    onChange={(value) => {
                                        if (Number(value) <= 0) {
                                            value = 1
                                        }
                                        setExpiryDays(Number(value))
                                    }}
                                    suffix="days"
                                    readOnly={!!proposal}
                                    autoComplete="off"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="right-column">
                        {/* Order Summary */}
                        <Card sectioned className="card-style sticky-card">
                            <Text variant="headingMd">Order Summary</Text>
                            <div style={{ marginTop: '16px' }}>
                                <div className="summary-line">
                                    <span>Subtotal</span>
                                    <span>{quantity} item(s)</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Discount</span>
                                    <span>{discountType === "PERCENTAGE" ? discountValue + "%" : "$" + discountValue}</span>
                                    <span>- ${discountAmount.toFixed(2)}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Shipping</span>
                                    <span>{shippingTitle || "—"}</span>
                                    <span>${Number(shippingAmount).toFixed(2)}</span>
                                </div>
                                <div className="summary-total">
                                    <span>Total</span>
                                    <span>${finalTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Customer Information */}
                        <Card sectioned className="card-style sticky-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text variant="headingMd">Customer Information</Text>
                                <Text variant="bodySm" tone="subdued">{quote.created_at}</Text>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {Object.entries(customerInfo).map(([key, value]) => (
                                    <div key={key}>
                                        <Text variant="bodyMd" fontWeight="medium">{key}</Text>
                                        <Text variant="bodyMd">{value}</Text>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Page>
    );
}
