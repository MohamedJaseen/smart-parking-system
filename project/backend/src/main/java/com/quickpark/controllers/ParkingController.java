package com.quickpark.controllers;

import com.quickpark.models.ParkingLocation;
import com.quickpark.models.ParkingSlot;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/locations")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ParkingController {

    private final List<ParkingLocation> locations = new ArrayList<>();
    private final List<ParkingSlot> slots = new ArrayList<>();

    public ParkingController() {
        // Seed default locations for demonstration compilation
        ParkingLocation loc1 = new ParkingLocation();
        loc1.setId("loc_1");
        loc1.setName("T. Nagar Parking Plaza");
        loc1.setAddress("Pondy Bazaar, T. Nagar, Chennai - 600017");
        loc1.setTotalSlots(10);
        loc1.setAvailableSlots(10);
        loc1.setHourlyRate(new BigDecimal("50.00"));
        loc1.setDailyRate(new BigDecimal("250.00"));
        locations.add(loc1);

        // Seed default slots
        for (int i = 1; i <= 5; i++) {
            ParkingSlot slot = new ParkingSlot();
            slot.setId("s_loc_1_sedan_" + i);
            slot.setLocationId("loc_1");
            slot.setSlotNumber("A" + i);
            slot.setVehicleType("sedan");
            slot.setStatus("available");
            slots.add(slot);
        }
    }

    @GetMapping
    public ResponseEntity<List<ParkingLocation>> getAllLocations() {
        return ResponseEntity.ok(locations);
    }

    @PostMapping
    public ResponseEntity<ParkingLocation> createLocation(@RequestBody ParkingLocation location) {
        locations.add(location);
        return ResponseEntity.ok(location);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParkingLocation> updateLocation(@PathVariable String id, @RequestBody ParkingLocation updated) {
        for (int i = 0; i < locations.size(); i++) {
            if (locations.get(i).getId().equals(id)) {
                locations.set(i, updated);
                return ResponseEntity.ok(updated);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable String id) {
        locations.removeIf(l => l.getId().equals(id));
        slots.removeIf(s -> s.getLocationId().equals(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<ParkingSlot>> getSlotsByLocation(@PathVariable String id) {
        List<ParkingSlot> filtered = slots.stream()
                .filter(s -> s.getLocationId().equals(id))
                .collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }
}
