const pool = require('../config/db');

function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  pool.getConnection((connectionError, connection) => {
    if (connectionError) return callback(connectionError);

    let finished = false;
    const finish = (err, result) => {
      if (finished) return;
      finished = true;
      connection.release();
      callback(err, result);
    };

    const rollbackAndFinish = (err, result) => {
      connection.rollback((rollbackError) => {
        finish(rollbackError || err, rollbackError ? undefined : result);
      });
    };

    connection.beginTransaction((transactionError) => {
      if (transactionError) return finish(transactionError);

      const bookingSql = `
        INSERT INTO service_bookings
          (pet_id, service_id, booking_date, booked_price, booking_status)
        SELECT pets.id, services.id, ?, services.price, 'pending'
        FROM pets
        JOIN services ON services.id = ? AND services.is_active = 1
        WHERE pets.id = ? AND pets.owner_id = ?
      `;

      connection.query(
        bookingSql,
        [bookingDate, serviceId, petId, ownerId],
        (bookingError, bookingResult) => {
          if (bookingError) return rollbackAndFinish(bookingError);
          if (bookingResult.affectedRows === 0) {
            return rollbackAndFinish(null, null);
          }
          if (bookingResult.affectedRows !== 1 || !bookingResult.insertId) {
            return rollbackAndFinish(new Error('Booking insert did not create exactly one row.'));
          }

          const bookingId = bookingResult.insertId;
          const paymentSql = `
            INSERT INTO payments (booking_id, amount, payment_status)
            SELECT id, booked_price, 'pending'
            FROM service_bookings
            WHERE id = ?
          `;

          connection.query(paymentSql, [bookingId], (paymentError, paymentResult) => {
            if (paymentError) return rollbackAndFinish(paymentError);
            if (paymentResult.affectedRows !== 1) {
              return rollbackAndFinish(new Error('Payment insert did not create exactly one row.'));
            }

            const paymentId = paymentResult.insertId;
            connection.commit((commitError) => {
              if (commitError) return rollbackAndFinish(commitError);
              finish(null, { bookingId, paymentId });
            });
          });
        }
      );
    });
  });
}

function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT
      bookings.id AS booking_id,
      DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS booking_date,
      pets.name AS pet_name,
      services.name AS service_name,
      bookings.booked_price,
      bookings.booking_status,
      payments.payment_status,
      payments.payment_reference,
      bookings.created_at
    FROM service_bookings AS bookings
    JOIN pets ON pets.id = bookings.pet_id
    JOIN services ON services.id = bookings.service_id
    LEFT JOIN payments ON payments.booking_id = bookings.id
    WHERE pets.owner_id = ?
    ORDER BY bookings.created_at DESC, bookings.id DESC
  `;
  pool.query(sql, [ownerId], callback);
}

module.exports = {
  createPendingBooking,
  getBookingsByOwner
};
