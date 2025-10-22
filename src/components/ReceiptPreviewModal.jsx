import React from "react";
import { Modal, Button } from "react-bootstrap";

function ReceiptPreviewModal({ show, onHide, imgData, whatsappLink }) {
  const copyImageToClipboard = async () => {
    try {
      const blob = await (await fetch(imgData)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      alert("✅ Image copied to clipboard!");
    } catch (err) {
      console.error(err);
      alert("❌ Copy failed — please long-press and copy manually.");
    }
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title>Receipt Preview</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ textAlign: "center" }}>
        <img
          src={imgData}
          alt="Receipt"
          style={{
            maxWidth: "100%",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        />
        <p style={{ fontSize: "13px", color: "#555" }}>
          You can copy or share the receipt.
        </p>
      </Modal.Body>

      <Modal.Footer style={{ justifyContent: "center" }}>
        {whatsappLink ? (
          <Button
            variant="success"
            as="a"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#25D366", border: "none" }}
          >
            📲 Send via WhatsApp
          </Button>
        ) : null}

        <Button variant="primary" onClick={copyImageToClipboard}>
          📋 Copy Image
        </Button>

        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ReceiptPreviewModal;
