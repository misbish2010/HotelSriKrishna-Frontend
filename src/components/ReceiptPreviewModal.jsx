import React from "react";
import { Modal, Button } from "react-bootstrap";

function ReceiptPreviewModal({ show, onHide, imgData, whatsappLink }) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const copyImageToClipboard = async () => {
    try {
      const blob = await (await fetch(imgData)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      alert("✅ Image copied to clipboard!");
    } catch (err) {
      console.error(err);
      alert("❌ Copy not supported on this device.");
    }
  };

  const shareImageMobile = async () => {
    try {
      const blob = await (await fetch(imgData)).blob();
      const file = new File([blob], "receipt.png", { type: blob.type });

      if (navigator.share) {
        await navigator.share({
          title: "Hotel Receipt",
          text: "Hotel Sri Krishna Receipt",
          files: [file],
        });
      } else {
        alert("❌ Share not supported on this browser.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Sharing failed.");
    }
  };

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
          {isMobile
            ? "Tap Share or long-press the image to save."
            : "Click Copy to copy the receipt image."}
        </p>
      </Modal.Body>

      <Modal.Footer style={{ justifyContent: "center" }}>
        {whatsappLink && (
          <Button
            variant="success"
            as="a"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            📲 Send via WhatsApp
          </Button>
        )}

        {isMobile ? (
          <Button variant="primary" onClick={shareImageMobile}>
            📤 Share Image
          </Button>
        ) : (
          <Button variant="primary" onClick={copyImageToClipboard}>
            📋 Copy Image
          </Button>
        )}

        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ReceiptPreviewModal;
