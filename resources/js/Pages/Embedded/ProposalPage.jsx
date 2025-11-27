import React from "react";
import { Inertia } from "@inertiajs/inertia";

const ProposalPage = ({ proposal }) => {
    const { product, variant, pricing, quotation_id, status } = proposal;

    const handleAction = (action) => {
        Inertia.post(`/proposal/${action}/${quotation_id}`);
    };

    return (
        <div
            style={{
                maxWidth: 600,
                margin: "40px auto",
                padding: 0,
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#fff",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
        >
            {/* Header - Matching the image style */}
            <div
                style={{
                    textAlign: "center",
                    backgroundColor: "#fff",
                    padding: "40px 30px",
                    borderBottom: "1px solid #e0e0e0",
                }}
            >
                <h1 style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: 15
                }}>
                    Your Quote Request Has Been Received
                </h1>
                <p style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#666",
                    marginBottom: 10
                }}>
                    Your Quote Request is in Progress
                </p>
                <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#777",
                    lineHeight: 1.5
                }}>
                    Thank you for your interest! We've received your quote request, and<br />
                    we're currently working on it. You'll receive a proposal with pricing soon.
                </p>
            </div>

            {/* Product Section */}
            <div style={{
                padding: "30px",
                backgroundColor: "#f9f9f9",
                borderBottom: "1px solid #e0e0e0"
            }}>
                <div style={{
                    textAlign: "center",
                    marginBottom: 25
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: 18,
                        color: "#333",
                        fontWeight: "normal"
                    }}>
                        Product:
                    </h3>
                    <h2 style={{
                        margin: "5px 0 0 0",
                        fontSize: 24,
                        color: "#333",
                        fontWeight: "bold"
                    }}>
                        {product.title}
                    </h2>
                </div>

                {/* Product Details Card */}
                <div style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    maxWidth: 400,
                    margin: "0 auto"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        marginBottom: 20
                    }}>
                        <img
                            src={product.image || "https://via.placeholder.com/80?text=No+Image"}
                            alt={product.title}
                            style={{
                                width: 80,
                                height: 80,
                                objectFit: "cover",
                                borderRadius: 6
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "0 0 5px 0", fontSize: 16, color: "#333" }}>
                                {variant.title}
                            </h4>
                            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
                                SKU: {variant.sku}
                            </p>
                            <p style={{ margin: "5px 0 0 0", fontSize: 14, color: "#666" }}>
                                Qty: {variant.quantity}
                            </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: "bold",
                                color: "#333"
                            }}>
                                ${Number(variant.price_per_unit).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div style={{
                        borderTop: "1px solid #e0e0e0",
                        paddingTop: 15
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                        }}>
                            <span style={{ color: "#666" }}>Subtotal:</span>
                            <span style={{ fontWeight: "bold" }}>
                                ${Number(pricing.subtotal).toLocaleString()}
                            </span>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                        }}>
                            <span style={{ color: "#666" }}>Discount:</span>
                            <span style={{ color: "#e53935", fontWeight: "bold" }}>
                                -${Number(pricing.discount).toLocaleString()}
                            </span>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                        }}>
                            <span style={{ color: "#666" }}>Shipping:</span>
                            <span style={{ fontWeight: "bold" }}>
                                ${Number(pricing.shipping_charges).toLocaleString()}
                            </span>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: "2px solid #333",
                            fontSize: 18,
                            fontWeight: "bold"
                        }}>
                            <span>Final Total:</span>
                            <span>${Number(pricing.final_total).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 15,
                    padding: "30px",
                    backgroundColor: "#fff"
                }}
            >
                <button
                    onClick={() => handleAction("reject")}
                    style={{
                        padding: "12px 30px",
                        backgroundColor: "#fff",
                        color: "#e53935",
                        border: "2px solid #e53935",
                        borderRadius: 6,
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: 14,
                        minWidth: 140
                    }}
                >
                    Reject Proposal
                </button>
                <button
                    onClick={() => handleAction("accept")}
                    style={{
                        padding: "12px 30px",
                        backgroundColor: "#4CAF50",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: 14,
                        minWidth: 140
                    }}
                >
                    Accept Proposal
                </button>
            </div>
        </div>
    );
};

export default ProposalPage;
