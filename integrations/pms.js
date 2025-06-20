import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('pms-integration');

class PMSIntegration {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.hotelId = config.hotelId;
    
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Hotel-ID': this.hotelId
      }
    });
  }

  async getGuestInfo(roomNumber) {
    try {
      const response = await this.axios.get(`/guests/room/${roomNumber}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching guest info:', error);
      throw new Error('Failed to fetch guest information from PMS');
    }
  }

  async getReservationInfo(reservationId) {
    try {
      const response = await this.axios.get(`/reservations/${reservationId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching reservation:', error);
      throw new Error('Failed to fetch reservation information');
    }
  }

  async getRoomStatus(roomNumber) {
    try {
      const response = await this.axios.get(`/rooms/${roomNumber}/status`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching room status:', error);
      throw new Error('Failed to fetch room status');
    }
  }

  async createServiceRequest(roomNumber, requestData) {
    try {
      const response = await this.axios.post('/service-requests', {
        roomNumber,
        ...requestData
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating service request:', error);
      throw new Error('Failed to create service request');
    }
  }

  async updateGuestPreferences(guestId, preferences) {
    try {
      const response = await this.axios.patch(`/guests/${guestId}/preferences`, {
        preferences
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating guest preferences:', error);
      throw new Error('Failed to update guest preferences');
    }
  }

  async getAvailableServices() {
    try {
      const response = await this.axios.get('/services/available');
      return response.data;
    } catch (error) {
      logger.error('Error fetching available services:', error);
      throw new Error('Failed to fetch available services');
    }
  }

  async checkIn(reservationId, guestData) {
    try {
      const response = await this.axios.post(`/reservations/${reservationId}/check-in`, guestData);
      return response.data;
    } catch (error) {
      logger.error('Error during check-in:', error);
      throw new Error('Failed to process check-in');
    }
  }

  async checkOut(reservationId) {
    try {
      const response = await this.axios.post(`/reservations/${reservationId}/check-out`);
      return response.data;
    } catch (error) {
      logger.error('Error during check-out:', error);
      throw new Error('Failed to process check-out');
    }
  }

  async getRoomCharges(roomNumber) {
    try {
      const response = await this.axios.get(`/rooms/${roomNumber}/charges`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching room charges:', error);
      throw new Error('Failed to fetch room charges');
    }
  }

  async addRoomCharge(roomNumber, chargeData) {
    try {
      const response = await this.axios.post(`/rooms/${roomNumber}/charges`, chargeData);
      return response.data;
    } catch (error) {
      logger.error('Error adding room charge:', error);
      throw new Error('Failed to add room charge');
    }
  }

  async getHousekeepingStatus(roomNumber) {
    try {
      const response = await this.axios.get(`/housekeeping/rooms/${roomNumber}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching housekeeping status:', error);
      throw new Error('Failed to fetch housekeeping status');
    }
  }

  async requestHousekeeping(roomNumber, requestType) {
    try {
      const response = await this.axios.post('/housekeeping/requests', {
        roomNumber,
        requestType
      });
      return response.data;
    } catch (error) {
      logger.error('Error requesting housekeeping:', error);
      throw new Error('Failed to request housekeeping');
    }
  }

  async getRestaurantReservations(restaurantId, date) {
    try {
      const response = await this.axios.get(`/restaurants/${restaurantId}/reservations`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching restaurant reservations:', error);
      throw new Error('Failed to fetch restaurant reservations');
    }
  }

  async makeRestaurantReservation(restaurantId, reservationData) {
    try {
      const response = await this.axios.post(`/restaurants/${restaurantId}/reservations`, 
        reservationData
      );
      return response.data;
    } catch (error) {
      logger.error('Error making restaurant reservation:', error);
      throw new Error('Failed to make restaurant reservation');
    }
  }

  async getSpaAppointments(date) {
    try {
      const response = await this.axios.get('/spa/appointments', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching spa appointments:', error);
      throw new Error('Failed to fetch spa appointments');
    }
  }

  async bookSpaAppointment(appointmentData) {
    try {
      const response = await this.axios.post('/spa/appointments', appointmentData);
      return response.data;
    } catch (error) {
      logger.error('Error booking spa appointment:', error);
      throw new Error('Failed to book spa appointment');
    }
  }
}

export default PMSIntegration; 