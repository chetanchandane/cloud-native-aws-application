import React, { useState } from 'react';
import '../styles/Textract.css';

const Textract = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('Awaiting upload...');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadLabelImage = async () => {
    if (!file) {
      alert('Choose a file');
      return;
    }

    setResult('Uploading image...');

    try {
      const signedUrlRes = await fetch(
        `https://hztpfkoe5g.execute-api.us-east-1.amazonaws.com/prod/generate-upload-url?name=${file.name}`,
        // `${process.env.REACT_APP_aws_api_base_url}/generate-upload-url?name=${file.name}`,
      );
      console.log('Signed URL Response:', signedUrlRes);
      const { upload_url } = await signedUrlRes.json();

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
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult('Upload failed.');
    }
  };

  const pollForTextractResults = async (imageKey) => {
    const apiUrl = `https://hztpfkoe5g.execute-api.us-east-1.amazonaws.com/prod/get-label-data?name=${encodeURIComponent(imageKey)}`;
    // const apiUrl = `${process.env.REACT_APP_aws_api_base_url}/get-label-data?name=${encodeURIComponent(imageKey)}`;

    for (let i = 0; i < 10; i++) {
      await new Promise((res) => setTimeout(res, 3000));

      try {
        console.log('apiURL: ', apiUrl)
        const res = await fetch(apiUrl);
        console.log('Polling response:', res);
        if (res.ok) {
          const data = await res.json();
          setResult(
            `<h3>Nutrition Extracted</h3>
            <p><strong>Calories:</strong> ${data.calories}</p>
            <p><strong>Protein:</strong> ${data.protein} g</p>
            <p><strong>Carbohydrates:</strong> ${data.carbohydrates} g</p>
            <p><strong>Fat:</strong> ${data.fat} g</p>`
          );
          return;
        }
      } catch (err) {
        console.warn('Polling attempt failed:', err);
      }
    }

    setResult('⏳ Textract timed out. Try again.');
  };

  return (
    <div className="textract-container">
      <h2>Upload Nutrition Label</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadLabelImage}>Upload</button>

      <div
        className="nutrition-card"
        id="result"
        dangerouslySetInnerHTML={{ __html: result }}
      />
    </div>
  );
};

export default Textract;
