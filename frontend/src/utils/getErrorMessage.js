// Turns an Axios error into one readable message
export default function getErrorMessage(err) {
  const data = err.response?.data;

  if (data?.errors?.length) {
    return data.errors.map((e) => e.message || e).join(". ");
  }
  return data?.message || err.message || "Something went wrong";
}