export const errorHandler = (err, req, res, next) => {
    const error = { ...err };
  
    error.message = err.message;
  
    if (error.message === "jwt malformed") {
      error.message = "Та логин хийж байж энэ үйлдлийг хийх боломжтой...";
      error.statusCode = 401;
    }
  
    if (error.name === "JsonWebTokenError" && error.message === "invalid token") {
      error.message = "Буруу токен дамжуулсан байна!";
      error.statusCode = 400;
    }
  
    if (
      error.name === "JsonWebTokenError" &&
      error.message === "invalid signature"
    ) {
      error.message = "Токены нууц үг буруу байна!";
      error.statusCode = 400;
    }
  
    if (error.code === 11000) {
      error.message = "Энэ талбарын утгыг давхардуулж өгч болохгүй!";
      error.statusCode = 400;
    }
  
    res.status(error.statusCode || 500).json({
      success: false,
      error,
    });
  };
  
  