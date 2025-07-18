import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';

const HealthRecords = ({ userRole = 'patient', patientId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    condition: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchHealthRecords();
  }, [patientId]);

  const fetchHealthRecords = async () => {
    try {
      const endpoint = `/api/health-records/${patientId || user.id}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRecords(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching health records:', err);
      setError(err.response?.data?.message || 'Failed to fetch health records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, record = null) => {
    setDialogMode(mode);
    if (record) {
      setSelectedRecord(record);
      setFormData({
        title: record.title,
        description: record.description,
        condition: record.condition,
        date: new Date(record.date).toISOString().split('T')[0]
      });
    } else {
      setSelectedRecord(null);
      setFormData({
        title: '',
        description: '',
        condition: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setFormData({
      title: '',
      description: '',
      condition: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogMode === 'add') {
        await axios.post(`/api/health-records/${patientId}`, {
          ...formData,
          patientId: patientId || user.id
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else if (dialogMode === 'edit') {
        await axios.put(`/api/health-records/${selectedRecord._id}`, {
          ...formData,
          patientId: patientId || user.id
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      fetchHealthRecords();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving health record:', err);
      setError(err.response?.data?.message || 'Failed to save health record');
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/health-records/${recordId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchHealthRecords();
      } catch (err) {
        console.error('Error deleting health record:', err);
        setError('Failed to delete health record');
      }
    }
  };

  const handleShare = async (recordId) => {
    try {
      await axios.post(`/api/health-records/${recordId}/share`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Health record shared successfully with connected doctors');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share health record');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">{error}</div>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Health Records</Typography>
        {userRole === 'doctor' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Record
          </Button>
        )}
      </Box>

      {records.length === 0 ? (
        <Typography variant="body1" color="textSecondary" align="center">
          No health records found.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.condition}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('view', record)}
                      >
                        <ViewIcon />
                      </IconButton>
                      {userRole === 'doctor' && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog('edit', record)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(record._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Health Record' :
           dialogMode === 'edit' ? 'Edit Health Record' : 'View Health Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={dialogMode === 'view'}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={dialogMode === 'view'}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              disabled={dialogMode === 'view'}
              margin="normal"
            />
            <TextField
              fullWidth
              type="date"
              label="Date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              disabled={dialogMode === 'view'}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {dialogMode === 'add' ? 'Add Record' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

HealthRecords.propTypes = {
  userRole: PropTypes.oneOf(['patient', 'doctor', 'admin']).isRequired,
  patientId: PropTypes.string.isRequired
};

export default HealthRecords; 