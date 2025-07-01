// import React, { useState } from "react";
// import { Loader2 } from "lucide-react"; // Optional spinner

// const ImageUpload = () => {
//   const [file, setFile] = useState(null);
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const UPLOAD_API_URL = `https://o0rr6dsmoh.execute-api.us-east-1.amazonaws.com`;

//   const handleFileChange = (e) => setFile(e.target.files[0]);

//   const handleUpload = async () => {
//     if (!file) return;
//     setLoading(true);
//     setError(null);

//     try {
//       // Step 1: Get the presigned URL
//       const presignedRes = await fetch(UPLOAD_API_URL, { method: "GET" });
//       const { upload_url } = await presignedRes.json();

//       // Step 2: Extract imageKey from the presigned URL
//       const url = new URL(upload_url);
//       const imageKey = decodeURIComponent(url.pathname.substring(1)); // remove leading '/'

//       // Step 3: Upload the image to S3
//       const uploadRes = await fetch(upload_url, {
//         method: "PUT",
//         headers: { "Content-Type": file.type },
//         body: file,
//       });

//       if (!uploadRes.ok) throw new Error("Upload to S3 failed");

//       // Step 4: Wait for backend processing
//       setTimeout(async () => {
//         try {
//           const RESULT_API_URL = `https://ifsoeybtlk.execute-api.us-east-1.amazonaws.com/result/${imageKey}`;
//           const res = await fetch(RESULT_API_URL);
//           if (!res.ok) throw new Error("Failed to fetch nutrition analysis");

//           const json = await res.json();
//           setData(json);
//         } catch (err) {
//           setError(err.message);
//         } finally {
//           setLoading(false);
//         }
//       }, 3000); // adjust delay if needed
//     } catch (err) {
//       setError(err.message);
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-4 border rounded-md shadow-sm bg-white">
//       <h2 className="text-lg font-bold mb-2">Upload Food Image</h2>
//       <input
//         type="file"
//         onChange={handleFileChange}
//         accept="image/*"
//         className="mb-4"
//       />
//       <button
//         onClick={handleUpload}
//         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//       >
//         Upload
//       </button>

//       {loading && (
//         <div className="mt-4 flex items-center gap-2 text-blue-600">
//           <Loader2 className="animate-spin" /> Processing...
//         </div>
//       )}

//       {error && <div className="text-red-600 mt-4">Error: {error}</div>}

//       {data && (
//         <div className="mt-6 border p-4 rounded-md shadow-md bg-gray-50">
//           <h2 className="text-xl font-bold mb-4">Nutrition Summary</h2>
//           <ul className="space-y-1 text-left">
//             <li><strong>Food:</strong> {data.food_name}</li>
//             <li><strong>Calories:</strong> {data.calories}</li>
//             <li><strong>Carbohydrates:</strong> {data.carbohydrates} g</li>
//             <li><strong>Protein:</strong> {data.protein} g</li>
//             <li><strong>Fat:</strong> {data.fat} g</li>
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageUpload;




import React, { useState } from "react";
import { Loader2 } from "lucide-react";

const ImageUpload = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const UPLOAD_API_URL = `https://6nreu1kakh.execute-api.us-east-1.amazonaws.com`;
  // const UPLOAD_API_URL = `${process.env.REACT_APP_aws_api_base_url}/upload-url`;

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const pollForResult = async (imageKey, attempts = 30, delay = 2000) => {
    const RESULT_API_URL = `https://eznvhkrpak.execute-api.us-east-1.amazonaws.com/result/${imageKey}`;
    // const RESULT_API_URL = `${process.env.REACT_APP_aws_api_base_url}/result/${imageKey}`;
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(RESULT_API_URL);
      if (res.ok) return await res.json();
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Timeout: Nutrition data not available yet.");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Step 1: Get the presigned URL
      const presignedRes = await fetch(UPLOAD_API_URL, { method: "GET" });
      const { upload_url } = await presignedRes.json();

      // Step 2: Extract imageKey
      const url = new URL(upload_url);
      const imageKey = decodeURIComponent(url.pathname.substring(1)); // remove leading '/'

      // Step 3: Upload to S3
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload to S3 failed");

      // Step 4: Poll backend for nutrition data
      const result = await pollForResult(imageKey);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white">
      <h2 className="text-lg font-bold mb-2">Upload Food Image</h2>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Upload
      </button>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <Loader2 className="animate-spin" /> Processing...
        </div>
      )}

      {error && <div className="text-red-600 mt-4">Error: {error}</div>}

      {data && (
        <div className="mt-6 border p-4 rounded-md shadow-md bg-gray-50">
          <h2 className="text-xl font-bold mb-4">Nutrition Summary</h2>
          <ul className="space-y-1 text-left">
            <li><strong>Food:</strong> {data.food_name}</li>
            <li><strong>Calories:</strong> {data.calories}</li>
            <li><strong>Carbohydrates:</strong> {data.carbohydrates} g</li>
            <li><strong>Protein:</strong> {data.protein} g</li>
            <li><strong>Fat:</strong> {data.fat} g</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
