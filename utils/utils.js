const handleNumber = (to) => {
  let numberDestination = to
  if (numberDestination.startsWith("08")) {
    numberDestination = numberDestination.replace("0", "62")
  }
  if (numberDestination.startsWith("+")) {
    numberDestination = numberDestination.replace("+", "")
  }
  numberDestination = numberDestination.replace(/ /g, "")
  numberDestination = numberDestination.replace(/-/g, "")
  numberDestination = `${numberDestination}@s.whatsapp.net`
  return numberDestination
}

module.exports = {
  handleNumber
}