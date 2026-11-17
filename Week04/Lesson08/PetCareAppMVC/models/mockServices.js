// Mock service catalogue (source of truth for names and prices)
const services = [
  { id: 1, name: 'Vaccination', price: 35 },
  { id: 2, name: 'Pet Grooming', price: 50 },
  { id: 3, name: 'Boarding', price: 80 }
];

// Exact match on ID string, so "01" or "1.0" do not match
function getServiceById(id) {
  return services.find(s => String(s.id) === String(id));
}

module.exports = {
  getServiceById
};
