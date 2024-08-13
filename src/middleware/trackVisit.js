import userAgent from 'useragent';
import Visit from '../models/visitModel.js'; // Adjust the path if necessary

// Middleware to track visits
export const trackVisit = (req, res, next) => {
  const agent = userAgent.parse(req.headers['user-agent']);
  const deviceInfo = `${agent.device.family} (${agent.os.family} ${agent.os.major})`;

  const visit = new Visit({
    userAgent: deviceInfo,
  });

  visit
    .save()
    .then(() => next())
    .catch(next);
};
