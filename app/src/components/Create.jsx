import { useEffect, useState } from 'react';
import { Button, Form, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import axios from 'axios';
import "../App.css";

const Create = ({ contractAddress, contractABI }) => {
  const [processing, setProcessing] = useState(false);
  const [formInfo, setFormInfo] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    imageHash: ""
  });

  useEffect(() => {
    document.title = "Create Campaign";
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormInfo((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const headers = {
      'Content-Type': 'multipart/form-data',
      pinata_api_key: "YOUR_API_KEY",
      pinata_secret_api_key: "YOUR_SECRET_API_KEY",
    };

    try {
      const response = await axios.post(url, formData, { headers });
      setFormInfo((prevState) => ({
        ...prevState,
        imageHash: response.data.IpfsHash,
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error("Image upload failed", error);
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.ethereum) {
      toast.error("Please install MetaMask");
      return;
    }

    if (!formInfo.imageHash || formInfo.target <= 0 || formInfo.deadline <= Date.now() / 1000) {
      toast.error("Please fill all fields correctly");
      return;
    }

    setProcessing(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const targetInWei = ethers.utils.parseEther(formInfo.target);

      const tx = await contract.createCampaign(
        await signer.getAddress(),
        formInfo.title,
        formInfo.description,
        targetInWei,
        formInfo.deadline,
        formInfo.imageHash
      );

      await tx.wait();
      toast.success("Campaign created successfully");
      setFormInfo({ title: "", description: "", target: "", deadline: "", imageHash: "" });
    } catch (error) {
      console.error(error);
      toast.error("Transaction failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900">
      <main className="container mx-auto px-6 py-8">
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Campaign</h2>
          <Row>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Upload Image</Form.Label>
              <Form.Control type="file" onChange={(e) => handleImageUpload(e.target.files[0])} />
            </Form.Group>
            <Form.Control onChange={handleChange} name="title" required type="text" placeholder="Title" />
            <Form.Control onChange={handleChange} name="description" required as="textarea" placeholder="Description" />
            <Form.Control onChange={handleChange} name="target" required type="text" placeholder="Target (ETH)" />
            <Form.Control onChange={handleChange} name="deadline" required type="number" placeholder="Deadline (Unix Timestamp)" />
            <Button onClick={handleSubmit} disabled={processing}>{processing ? 'Creating...' : 'Create Campaign'}</Button>
          </Row>
        </div>
      </main>
    </div>
  );
};

export default Create;
