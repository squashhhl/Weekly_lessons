const petModel = require('../models/petModel');
const serviceModel = require('../models/serviceModel');
const serviceBookingModel = require('../models/serviceBookingModel');

const VALIDATION_ERROR = 'Choose a pet, service, and valid booking date.';
const UNAVAILABLE_ERROR = 'That pet or service is unavailable for booking.';
const BOOKING_ERROR = 'Unable to create the booking. Please try again.';
const BOOKING_SUCCESS = 'Booking created. Payment is pending; no payment has been processed.';

function positiveInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function localDateString(date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidBookingDate(value, today) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31, leapYear ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  ];

  return day >= 1 && day <= daysInMonth[month - 1] && value >= today;
}

function listServices(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (petError, pets) => {
    if (petError) {
      console.error('Error loading pets for services:', petError);
      return res.status(500).send('Unable to load pets.');
    }

    serviceModel.getActiveServices((serviceError, services) => {
      if (serviceError) {
        console.error('Error loading services:', serviceError);
        return res.status(500).send('Unable to load services.');
      }

      const requestedPetId = positiveInteger(req.query.petId);
      const selectedPet = requestedPetId === null
        ? null
        : pets.find(pet => Number(pet.id) === requestedPetId);

      return res.render('services', {
        pets,
        services,
        selectedPetId: selectedPet ? String(selectedPet.id) : '',
        today: localDateString(new Date()),
        messages: req.flash('success'),
        errors: req.flash('error'),
        session: req.session
      });
    });
  });
}

function createBooking(req, res) {
  const ownerId = req.session.user.id;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const petId = positiveInteger(body.petId);
  const serviceId = positiveInteger(body.serviceId);
  const today = localDateString(new Date());
  const bookingDate = body.bookingDate;

  if (petId === null || serviceId === null || !isValidBookingDate(bookingDate, today)) {
    req.flash('error', VALIDATION_ERROR);
    return res.redirect('/services');
  }

  serviceBookingModel.createPendingBooking(
    ownerId,
    petId,
    serviceId,
    bookingDate,
    (err, booking) => {
      if (err) {
        console.error('Error creating service booking:', err);
        req.flash('error', BOOKING_ERROR);
        return res.redirect(`/services?petId=${encodeURIComponent(String(petId))}`);
      }

      if (!booking) {
        req.flash('error', UNAVAILABLE_ERROR);
        return res.redirect('/services');
      }

      req.flash('success', BOOKING_SUCCESS);
      return res.redirect('/bookings');
    }
  );
}

function listBookings(req, res) {
  const ownerId = req.session.user.id;

  serviceBookingModel.getBookingsByOwner(ownerId, (err, bookings) => {
    if (err) {
      console.error('Error loading booking history:', err);
      return res.status(500).send('Unable to load booking history.');
    }

    return res.render('bookings', {
      bookings,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = {
  listServices,
  createBooking,
  listBookings
};
