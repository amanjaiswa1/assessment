const { redisClient } = require('./redis');
const loginRateLimiter = async (req, res, next) => {
    try {
        const ip = req.ip;
        const key = `login_attempt:${ip}`;
        const attempts = await redisClient.incr(key);
        if (attempts == 1) {
            await redisClient.expire(key, 60)
        }
        if (attempts > 5) {
            return res.status(409).json({
                message: "TOO many attempts. Try again after 1min"
            })
        }
        next();
    } catch (error) {
        console.log("Rate Limit Error", error);
        next();
    }
}

module.exports = loginRateLimiter;