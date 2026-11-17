const payments = [
    { petName: "Chester", amount: 50, status: "APPROVED" },
    { petName: "Mochi", amount: 80, status: "PENDING" },
    { petName: "Mira", amount: 40, status: "DECLINED" }
]

console.log("Mochi's payment status is: " + payments[1].status);

for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];

    if (payment.status === "APPROVED") {
        console.log("Pet-care service for " + payment.petName + " is confirmed.");
    }  else if (payment.status === "PENDING") {
        console.log("Pet-care service for " + payment.petName + " is being processed.");
    }   else if (payment.status === "DECLINED") {
        console.log("Pet-care service for " + payment.petName + " is declined.");
    }
}