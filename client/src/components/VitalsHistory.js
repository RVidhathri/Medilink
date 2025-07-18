import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TablePagination
} from '@mui/material';

const VitalsHistory = () => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const response = await axios.get('/api/vitals/history');
      setVitals(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vitals history');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Vitals History
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Blood Pressure</TableCell>
              <TableCell>Heart Rate</TableCell>
              <TableCell>Temperature</TableCell>
              <TableCell>Oxygen Level</TableCell>
              <TableCell>Glucose Level</TableCell>
              <TableCell>Assessment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vitals
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((vital, index) => (
                <TableRow key={vital._id || index}>
                  <TableCell>{formatDate(vital.recordedAt)}</TableCell>
                  <TableCell>
                    {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                  </TableCell>
                  <TableCell>{vital.heartRate} bpm</TableCell>
                  <TableCell>{vital.temperature}°C</TableCell>
                  <TableCell>{vital.oxygenLevel}%</TableCell>
                  <TableCell>{vital.glucoseLevel} mg/dL</TableCell>
                  <TableCell>
                    {vital.assessment && (
                      <>
                        <Typography variant="body2" color="textSecondary">
                          Concerns: {vital.assessment.concerns.join(', ')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Recommendations: {vital.assessment.recommendations.join(', ')}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={vitals.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
};

export default VitalsHistory; 