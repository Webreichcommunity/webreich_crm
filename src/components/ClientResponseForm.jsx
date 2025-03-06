import React, { useState } from "react";

const ClientResponseForm = () => {
  const CLIENT_RESPONSE = ["Positive", "Neutral", "Negative"]; // Example responses

  const [clientData, setClientData] = useState({
    clientResponse: [], // Initialize as an empty array
    // Other fields in clientData
  });

  const handleInputChange1 = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox group for client response
    if (name === 'clientResponse') {
      setClientData((prev) => {
        const currentResponses = prev.clientResponse || []; // Ensure it's an array
        if (checked) {
          return { ...prev, clientResponse: [...currentResponses, value] }; // Add value if checked
        } else {
          return {
            ...prev,
            clientResponse: currentResponses.filter((response) => response !== value), // Remove value if unchecked
          };
        }
      });
    } else {
      // Handle other input types (e.g., text, radio, etc.)
      setClientData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div>
      <label className="block mb-2 text-gray-700">Client Response</label>
      <div className="grid grid-cols-3 gap-2">
        {CLIENT_RESPONSE.map((response) => (
          <label key={response} className="inline-flex items-center">
            <input
              type="checkbox"
              name="clientResponse"
              value={response}
              checked={clientData.clientResponse.includes(response)} // Check if response is selected
              onChange={handleInputChange1}
              className="form-checkbox text-orange-500"
            />
            <span className="ml-2">{response}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ClientResponseForm;