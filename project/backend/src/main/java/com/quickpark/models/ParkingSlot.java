package com.quickpark.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "parking_slots")
@Data
public class ParkingSlot {
    @Id
    private String id;

    @Column(name = "location_id", nullable = false)
    private String locationId;

    @Column(name = "slot_number", nullable = false)
    private String slotNumber;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType; // sedan, suv, bike, hatchback

    @Column(nullable = false)
    private String status = "available"; // available, occupied, reserved, maintenance
}
