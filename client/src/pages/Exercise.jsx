const generateExercisePlan = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await api.post('/api/exercise-plan/generate', {
      userId: user.id,
      fitnessLevel,
      goals: selectedGoals,
      medicalConditions
    });

    setExercisePlan(response.data);
    setError('');
  } catch (err) {
    console.error('Exercise plan error:', err);
    setError('Request failed with status code 404');
  } finally {
    setLoading(false);
  }
};

const fetchExistingExercisePlan = async () => {
  try {
    const response = await api.get(`/api/exercise-plan/${user.id}`);
    if (response.data) {
      setExercisePlan(response.data);
      setFitnessLevel(response.data.fitnessLevel || '');
      setSelectedGoals(response.data.goals || []);
      setMedicalConditions(response.data.medicalConditions || []);
      setError('');
    }
  } catch (err) {
    console.log('No existing exercise plan');
  }
}; 