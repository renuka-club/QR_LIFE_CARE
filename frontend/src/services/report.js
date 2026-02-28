import axios from "axios";

const API_URL = "http://localhost:5000/api/reports";

export const reportService = {
  getReports: () => axios.get(API_URL),
  uploadReport: (formData) =>
    axios.post(`${API_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
