import React, { useState } from 'react';

const NutritionLabelReader = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('Awaiting upload...');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadLabelImage = async () => {
    if (!file) {
      alert('Choose a file');
      return;
    }

    setResult('Uploading image...');
    setLoading(true);

    try {
      // Step 1: Get pre-signed URL
      const signedUrlRes = await fetch(
        `https://615lz5nc12.execute-api.us-east-1.amazonaws.com/generate-upload-url?name=${file.name}`
        // `${process.env.REACT_APP_aws_api_base_url}/generate-upload-url?name=${file.name}`,
      );
      const { upload_url } = await signedUrlRes.json();

      // Step 2: Upload to S3
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (uploadRes.ok) {
        setResult('Image uploaded. Running Textract...');
        pollForTextractResults(file.name);
      } else {
        setResult('Upload failed.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setResult('Error occurred during upload.');
      setLoading(false);
    }
  };

  const pollForTextractResults = async (imageKey) => {
    const apiUrl = `https://615lz5nc12.execute-api.us-east-1.amazonaws.com/get-label-data`;
    // const apiUrl = `${process.env.REACT_APP_aws_api_base_url}/get-label-data?name=${encodeURIComponent(imageKey)}`;


    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setResult(
          `<h3>Nutrition Extracted</h3>
            <p><strong>Calories:</strong> ${data.calories}</p>
            <p><strong>Protein:</strong> ${data.protein} g</p>
            <p><strong>Carbohydrates:</strong> ${data.carbohydrates} g</p>
            <p><strong>Fat:</strong> ${data.fat} g</p>`
        );
        setLoading(false);
        return;
      }
    }

    setResult('⏳ Textract timed out. Try again.');
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h2 style={{ color: '#333' }}>Upload Nutrition Label</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadLabelImage} disabled={loading}>
        Upload
      </button>

      <div
        className="nutrition-card"
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.5rem',
          border: '1px solid #ccc',
          borderRadius: '10px',
          backgroundColor: '#f9f9f9',
          maxWidth: '400px',
          whiteSpace: 'pre-wrap',
        }}
        dangerouslySetInnerHTML={{ __html: result }}
      />
    </div>
  );
};

export default NutritionLabelReader;
