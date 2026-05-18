import React, { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";

const ImageUpload = ({ label = "Upload photos" }) => {
  const [previews, setPreviews] = useState([]);

  const handleChange = (event) => {
    const files = Array.from(event.target.files || []);
    const next = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="h6 mb-3">{label}</Card.Title>
        <Form.Group controlId="imageUpload">
          <Form.Control type="file" multiple onChange={handleChange} />
        </Form.Group>
        <div className="image-preview-grid mt-3">
          {previews.map((img) => (
            <div key={img.name} className="image-preview">
              <img src={img.url} alt={img.name} />
            </div>
          ))}
        </div>
        <Button variant="outline-success" className="mt-3">
          Save Uploads
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ImageUpload;
